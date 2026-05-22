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

// VK Callback API
router.post(
  '/vk/:salonId',
  asyncHandler(async (req, res) => {
    // VK ожидает в ответ строку confirmation_code на confirmation-запрос
    const type = req.body?.type;
    if (type === 'confirmation') {
      const code = process.env.VK_CONFIRMATION_CODE || 'ok';
      res.status(200).send(code);
      return;
    }
    res.status(200).send('ok');
    if (type === 'message_new') {
      messageRouter.handleIncoming('vk', req.body, req.params.salonId).catch((e) =>
        console.error('[webhook/vk] error:', e)
      );
    }
  })
);

// MAX webhook
router.post(
  '/max/:salonId',
  asyncHandler(async (req, res) => {
    res.status(200).json({ ok: true });
    messageRouter.handleIncoming('max', req.body, req.params.salonId).catch((e) =>
      console.error('[webhook/max] error:', e)
    );
  })
);

export default router;
