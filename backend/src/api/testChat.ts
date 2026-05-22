// POST /api/salons/:id/test-chat — пробный чат для владельца.
// Не сохраняет в реальные таблицы. История в памяти процесса по sessionId, TTL 30 мин.
import { Router } from 'express';
import { asyncHandler } from '../middleware/errors';
import { aiAgent } from '../agents/aiAgent';
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

router.post(
  '/:id/test-chat',
  asyncHandler(async (req, res) => {
    const { text, sessionId: incomingId } = req.body as { text?: string; sessionId?: string };
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'text обязателен' });
      return;
    }
    const salonId = req.params.id;
    const sessionId = incomingId || crypto.randomUUID();
    let session = SESSIONS.get(sessionId);
    if (!session || session.salonId !== salonId) {
      session = { salonId, turns: [], updatedAt: Date.now() };
      SESSIONS.set(sessionId, session);
    }

    const { text: reply, usage } = await aiAgent.processDryRun(salonId, session.turns, text);

    session.turns.push({ role: 'user', text });
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
