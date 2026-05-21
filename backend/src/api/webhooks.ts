import { Router } from 'express';
import { messageRouter } from '../channels/messageRouter';
import { asyncHandler } from '../middleware/errors';

const router = Router();

// Telegram webhook
router.post(
  '/telegram',
  asyncHandler(async (req, res) => {
    // отвечаем сразу, обработка — асинхронно
    res.status(200).json({ ok: true });
    messageRouter.handleIncoming('telegram', req.body).catch((e) =>
      console.error('[webhook/telegram] handler error:', e)
    );
  })
);

// WhatsApp webhook (формат зависит от провайдера)
router.post(
  '/whatsapp',
  asyncHandler(async (req, res) => {
    res.status(200).json({ ok: true });
    messageRouter.handleIncoming('whatsapp', req.body).catch((e) =>
      console.error('[webhook/whatsapp] handler error:', e)
    );
  })
);

// Верификация webhook (Meta Cloud API делает GET-запрос с challenge)
router.get('/whatsapp', (req, res) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (req.query['hub.verify_token'] === verifyToken) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

export default router;
