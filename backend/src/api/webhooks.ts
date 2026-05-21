import { Router } from 'express';
import { messageRouter } from '../channels/messageRouter';
import { asyncHandler } from '../middleware/errors';

const router = Router();

// Telegram webhook для конкретного салона (multi-tenant)
router.post(
  '/telegram/:salonId',
  asyncHandler(async (req, res) => {
    const { salonId } = req.params;
    res.status(200).json({ ok: true });
    messageRouter.handleIncoming('telegram', req.body, salonId).catch((e) =>
      console.error('[webhook/telegram/:salonId] error:', e)
    );
  })
);

// Legacy Telegram webhook (без salonId) — используется первый активный салон
router.post(
  '/telegram',
  asyncHandler(async (req, res) => {
    res.status(200).json({ ok: true });
    messageRouter.handleIncoming('telegram', req.body).catch((e) =>
      console.error('[webhook/telegram] error:', e)
    );
  })
);

// WhatsApp webhook
router.post(
  '/whatsapp/:salonId',
  asyncHandler(async (req, res) => {
    const { salonId } = req.params;
    res.status(200).json({ ok: true });
    messageRouter.handleIncoming('whatsapp', req.body, salonId).catch((e) =>
      console.error('[webhook/whatsapp/:salonId] error:', e)
    );
  })
);

// Верификация webhook (Meta Cloud API делает GET-запрос с challenge)
router.get('/whatsapp/:salonId', (req, res) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (req.query['hub.verify_token'] === verifyToken) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

export default router;
