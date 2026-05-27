import { Router } from 'express';
import { messageRouter } from '../channels/messageRouter';
import { asyncHandler } from '../middleware/errors';
import { handleYClientsEvent } from '../channels/yclientsSync';

const router = Router();

// YClients webhook — двусторонняя sync (их записи → к нам).
// URL для регистрации в YClients: https://api.ailiva.ru/webhook/yclients
router.post(
  '/yclients',
  asyncHandler(async (req, res) => {
    res.status(200).json({ ok: true }); // YClients ждёт быстрый 200
    handleYClientsEvent(req.body).catch((e) =>
      console.error('[webhook/yclients] error:', e?.message)
    );
  })
);

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

// MAX webhook (формат TamTam: один update в теле, тип в update_type)
router.post(
  '/max/:salonId',
  asyncHandler(async (req, res) => {
    res.status(200).send('ok'); // Max ожидает 200 быстро
    const update = req.body;
    if (update?.update_type !== 'message_created') return;
    messageRouter.handleIncoming('max', update, req.params.salonId).catch((e) =>
      console.error('[webhook/max] error:', e)
    );
  })
);

// Avito Messenger webhook v3
router.post(
  '/avito/:salonId',
  asyncHandler(async (req, res) => {
    res.status(200).send('ok');
    const body = req.body;
    // Авито шлёт {payload: {type: 'message', value: {...}}} или legacy {value: {...}}
    const type = body?.payload?.type || body?.type;
    if (type && type !== 'message') return;
    // Игнорируем эхо собственных исходящих
    const v = body?.payload?.value || body?.value;
    if (v?.flags?.includes?.('outgoing')) return;
    messageRouter.handleIncoming('avito', body, req.params.salonId).catch((e) =>
      console.error('[webhook/avito] error:', e)
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
