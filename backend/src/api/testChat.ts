// POST /api/salons/:id/test-chat — пробный чат для владельца.
// Поддерживает JSON (text only) и multipart/form-data (text + image + voice).
// Не сохраняет в реальные таблицы. История в памяти процесса по sessionId, TTL 30 мин.
import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../middleware/errors';
import { aiAgent } from '../agents/aiAgent';
import { transcribeAudioBuffer } from '../utils/whisper';
import crypto from 'crypto';

const router = Router({ mergeParams: true });

type Turn = { role: 'user' | 'assistant'; text: string };
type Session = { salonId: string; turns: Turn[]; updatedAt: number };

const SESSIONS = new Map<string, Session>();
const TTL_MS = 30 * 60 * 1000;

// Чистим каждые 10 минут
setInterval(() => {
  const cutoff = Date.now() - TTL_MS;
  for (const [k, s] of SESSIONS) if (s.updatedAt < cutoff) SESSIONS.delete(k);
}, 10 * 60 * 1000).unref();

// Multer для multipart: в памяти, лимиты по размеру (image ≤ 5MB, voice ≤ 25MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'voice', maxCount: 1 },
]);

router.post(
  '/:id/test-chat',
  upload,
  asyncHandler(async (req, res) => {
    // Поля приходят либо из JSON body, либо из multipart
    const text = String(req.body?.text || '').trim();
    const incomingId = req.body?.sessionId ? String(req.body.sessionId) : undefined;
    const files = (req.files as { [field: string]: Express.Multer.File[] } | undefined) || {};
    const imageFile = files.image?.[0];
    const voiceFile = files.voice?.[0];

    // Должен быть либо текст, либо хотя бы вложение
    if (!text && !imageFile && !voiceFile) {
      res.status(400).json({ error: 'нужен text или вложение (image/voice)' });
      return;
    }

    const salonId = req.params.id;
    const sessionId = incomingId || crypto.randomUUID();
    let session = SESSIONS.get(sessionId);
    if (!session || session.salonId !== salonId) {
      session = { salonId, turns: [], updatedAt: Date.now() };
      SESSIONS.set(sessionId, session);
    }

    // Транскрипция голосового
    let finalText = text;
    if (voiceFile) {
      const transcript = await transcribeAudioBuffer(
        voiceFile.buffer,
        voiceFile.originalname || 'voice.webm'
      );
      if (transcript) {
        finalText = finalText ? `${finalText} ${transcript}` : transcript;
      } else if (!finalText) {
        finalText = '[голосовое — не удалось распознать]';
      }
    }

    // Картинка как буфер
    const images = imageFile
      ? [{ data: imageFile.buffer, mediaType: imageFile.mimetype || 'image/jpeg' }]
      : undefined;

    const { text: reply, usage } = await aiAgent.processDryRun(
      salonId,
      session.turns,
      finalText || '[вложение]',
      { images }
    );

    // Сохраняем в историю текст пользователя (с пометкой если было вложение)
    const userTurnText = imageFile
      ? `${finalText || ''} [фото]`.trim()
      : voiceFile && finalText && finalText !== '[голосовое — не удалось распознать]'
      ? `🎙 ${finalText}`
      : finalText;
    session.turns.push({ role: 'user', text: userTurnText });
    session.turns.push({ role: 'assistant', text: reply });
    if (session.turns.length > 40) session.turns = session.turns.slice(-40);
    session.updatedAt = Date.now();

    res.json({ sessionId, reply, usage, turns: session.turns });
  })
);

router.delete(
  '/:id/test-chat/:sessionId',
  asyncHandler(async (req, res) => {
    SESSIONS.delete(req.params.sessionId);
    res.json({ ok: true });
  })
);

export default router;
