// Веб-чат widget API: синхронный (request → reply в одном HTTP).
// Не использует cascadeSender — ответ возвращается прямо в response.
import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import prisma from '../db/prisma';
import { asyncHandler } from '../middleware/errors';
import { aiAgent } from '../agents/aiAgent';
import { messageRouter } from '../channels/messageRouter';
import { transcribeAudioBuffer } from '../utils/whisper';
import type { IClient, IIncomingMessage, ISalon } from '../../../shared/types';

const router = Router({ mergeParams: true });

// Multer для multipart: image ≤5MB, voice ≤25MB (общий лимит)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'voice', maxCount: 1 },
]);

// CORS для widget — разрешаем всё (виджет грузится на любом сайте салона)
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// POST /api/widget/:salonId/message
// Принимает JSON (text only) или multipart/form-data (text + image + voice)
router.post(
  '/:salonId/message',
  upload,
  asyncHandler(async (req, res) => {
    const { salonId } = req.params;
    const text = String(req.body?.text || '').trim();
    const incomingSessionId = req.body?.sessionId ? String(req.body.sessionId) : undefined;
    const name = req.body?.name ? String(req.body.name) : undefined;
    const phone = req.body?.phone ? String(req.body.phone) : undefined;
    const files = (req.files as { [field: string]: Express.Multer.File[] } | undefined) || {};
    const imageFile = files.image?.[0];
    const voiceFile = files.voice?.[0];

    if (!text && !imageFile && !voiceFile) {
      res.status(400).json({ error: 'нужен text или вложение (image/voice)' });
      return;
    }
    const sessionId = incomingSessionId || crypto.randomUUID();

    const salon = await prisma.salon.findUnique({ where: { id: salonId } });
    if (!salon || !salon.isActive) {
      res.status(404).json({ error: 'Салон не найден' });
      return;
    }

    // Транскрибируем голосовое в text
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
    if (!finalText && imageFile) finalText = '[фото]';

    // Картинку передаём в aiAgent через data:URL (он умеет такие в fetchImagesAsBlocks)
    const imageUrls = imageFile
      ? [`data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`]
      : undefined;

    const incoming: IIncomingMessage = {
      channel: 'webchat',
      externalUserId: sessionId,
      text: finalText,
      senderName: name,
      phone,
      imageUrls,
    };
    const client = await messageRouter.findOrCreateClient(salonId, incoming);

    // Обновим имя/телефон если пришли в этом запросе и ещё не сохранены
    if ((name && !client.name) || (phone && !client.phone)) {
      await prisma.client.update({
        where: { id: client.id },
        data: {
          name: client.name || name || null,
          phone: client.phone || phone || null,
        },
      });
    }

    const intent = aiAgent.detectIntent(finalText);
    // В БД сохраняем краткую пометку о вложениях (data-URL не храним — слишком жирно)
    const dbText = imageFile
      ? `${finalText} [фото]`.trim()
      : voiceFile
      ? `🎙 ${finalText}`
      : finalText;
    await prisma.message.create({
      data: {
        salonId,
        clientId: client.id,
        channel: 'webchat',
        direction: 'in',
        text: dbText,
        intent,
      },
    });

    const { text: reply, usage } = await aiAgent.process(
      client as unknown as IClient,
      incoming,
      salon as unknown as ISalon
    );

    await prisma.message.create({
      data: {
        salonId,
        clientId: client.id,
        channel: 'webchat',
        direction: 'out',
        text: reply,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cacheReadTokens: usage.cacheReadTokens,
        cacheCreateTokens: usage.cacheCreateTokens,
      },
    });

    res.json({ sessionId, reply });
  })
);

// GET /api/widget/:salonId/history?sessionId=...
router.get(
  '/:salonId/history',
  asyncHandler(async (req, res) => {
    const { salonId } = req.params;
    const { sessionId } = req.query as Record<string, string | undefined>;
    if (!sessionId) {
      res.json({ messages: [] });
      return;
    }
    const client = await prisma.client.findFirst({
      where: { salonId, webchatId: sessionId },
    });
    if (!client) {
      res.json({ messages: [] });
      return;
    }
    const messages = await prisma.message.findMany({
      where: { salonId, clientId: client.id },
      orderBy: { createdAt: 'asc' },
      take: 50,
      select: { id: true, text: true, direction: true, createdAt: true },
    });
    res.json({ messages });
  })
);

// GET /api/widget/:salonId/config — публичная конфигурация для виджета (название, приветствие)
router.get(
  '/:salonId/config',
  asyncHandler(async (req, res) => {
    const salon = await prisma.salon.findUnique({
      where: { id: req.params.salonId },
      select: { id: true, name: true, niche: true, isActive: true, settings: true },
    });
    if (!salon || !salon.isActive) {
      res.status(404).json({ error: 'Салон не найден' });
      return;
    }
    const s = (salon.settings as any) || {};
    res.json({
      salonId: salon.id,
      name: salon.name,
      niche: salon.niche,
      greeting: s.widgetGreeting || `Здравствуйте! Я AI-администратор «${salon.name}». Чем могу помочь?`,
      color: s.widgetColor || '#7C3AED',
    });
  })
);

export default router;
