// Лид-форма с лендинга: POST /api/leads.
// Шлёт нам в Telegram уведомление о новой заявке.
import { Router } from 'express';
import { asyncHandler } from '../middleware/errors';

const router = Router();

const LEADS_TG_TOKEN = process.env.LEADS_TG_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const LEADS_TG_CHAT = process.env.LEADS_TG_CHAT_ID;

// Простейший анти-спам: rate limit + honeypot + минимальная валидация
const SUBMITS = new Map<string, number[]>();
const WINDOW = 60_000;
const MAX_PER_WINDOW = 5;

router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, phone, business, message, plan, honeypot } = req.body as any;

    // Honeypot — если заполнено, это бот
    if (honeypot) {
      res.json({ ok: true });
      return;
    }

    if (!name || !phone || String(name).length < 2 || String(phone).length < 6) {
      res.status(400).json({ error: 'Укажите имя и телефон' });
      return;
    }

    // Rate limit по IP
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown';
    const now = Date.now();
    const arr = (SUBMITS.get(ip) || []).filter((t) => now - t < WINDOW);
    if (arr.length >= MAX_PER_WINDOW) {
      res.status(429).json({ error: 'Слишком много заявок, попробуйте позже' });
      return;
    }
    arr.push(now);
    SUBMITS.set(ip, arr);

    const text =
      `🆕 НОВАЯ ЗАЯВКА Liva AI\n\n` +
      `👤 Имя: ${name}\n` +
      `📞 Телефон: ${phone}\n` +
      (business ? `🏪 Бизнес: ${business}\n` : '') +
      (plan ? `💼 Тариф: ${plan}\n` : '') +
      (message ? `\n💬 Сообщение:\n${message}\n` : '') +
      `\n🌐 IP: ${ip}\n⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;

    console.log('[leads] new lead:', { name, phone, business, plan });

    if (LEADS_TG_TOKEN && LEADS_TG_CHAT) {
      try {
        const url = `https://api.telegram.org/bot${LEADS_TG_TOKEN}/sendMessage`;
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: LEADS_TG_CHAT,
            text,
            disable_web_page_preview: true,
          }),
        });
      } catch (err) {
        console.error('[leads] failed to notify Telegram:', err);
      }
    } else {
      console.warn('[leads] LEADS_TG_BOT_TOKEN / LEADS_TG_CHAT_ID не заданы — заявка только в логи');
    }

    res.json({ ok: true });
  })
);

export default router;
