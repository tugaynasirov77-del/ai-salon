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

// SMS callback (sms.ru / smsc — оба шлют form-encoded или JSON).
// sms.ru входящие: https://sms.ru/?panel=settings&subpanel=callback (поля: phone, message, my_phone, time)
// Привязываем к салону по pathparams.
router.post(
  '/sms/:salonId',
  asyncHandler(async (req, res) => {
    res.status(200).send('ok');
    // sms.ru шлёт application/x-www-form-urlencoded — наш express.json() это не парсит.
    // Поддерживаем оба варианта: либо JSON, либо form-encoded в req.body (если bodyparser стоит).
    // Если body пуст — берём из query.
    const data = Object.keys(req.body || {}).length ? req.body : req.query;
    const normalized = {
      sender: data.phone || data.from || data.sender,
      text: data.message || data.body || data.text,
    };
    if (!normalized.sender || !normalized.text) {
      console.warn('[webhook/sms] неполные данные:', data);
      return;
    }
    messageRouter.handleIncoming('sms', normalized, req.params.salonId).catch((e) =>
      console.error('[webhook/sms] error:', e)
    );
  })
);

export default router;
