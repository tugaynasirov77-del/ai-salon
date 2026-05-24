// Алёрты в Telegram владельцу платформы при критических ошибках.
// Использует LEADS_TG_BOT_TOKEN/LEADS_TG_CHAT_ID (тот же бот что и для лидов).
// Де-дупликация: одинаковый ключ → один алёрт в 5 минут.

const TOKEN = process.env.LEADS_TG_BOT_TOKEN;
const CHAT = process.env.LEADS_TG_CHAT_ID;
const ENV = process.env.NODE_ENV || 'dev';
const DEDUP_WINDOW_MS = 5 * 60 * 1000;

type AlertLevel = 'error' | 'warn' | 'info';

const recent = new Map<string, number>();

const ICONS: Record<AlertLevel, string> = {
  error: '🚨',
  warn: '⚠️',
  info: 'ℹ️',
};

function shouldSend(key: string): boolean {
  const now = Date.now();
  // Очищаем старые ключи
  for (const [k, t] of recent) {
    if (now - t > DEDUP_WINDOW_MS) recent.delete(k);
  }
  const last = recent.get(key);
  if (last && now - last < DEDUP_WINDOW_MS) return false;
  recent.set(key, now);
  return true;
}

export type AlertOpts = {
  level?: AlertLevel;
  title: string;
  details?: string | object;
  dedupKey?: string; // если задан — однотипные алёрты схлопываются
};

export async function sendAlert(opts: AlertOpts): Promise<void> {
  const level = opts.level || 'error';
  const key = opts.dedupKey || `${level}:${opts.title}`;

  if (!shouldSend(key)) return;

  // В dev — только в логи, без TG
  if (ENV !== 'production' && !process.env.FORCE_ALERTS) {
    console.log(`[alert ${level}] ${opts.title}`, opts.details || '');
    return;
  }

  if (!TOKEN || !CHAT) {
    console.warn('[alerter] LEADS_TG_BOT_TOKEN/CHAT_ID не заданы, алёрт в логи:', opts.title);
    return;
  }

  let detailsText = '';
  if (opts.details) {
    if (typeof opts.details === 'string') detailsText = opts.details;
    else
      detailsText = '```\n' + JSON.stringify(opts.details, null, 2).slice(0, 1500) + '\n```';
  }

  const text = `${ICONS[level]} ${opts.title}\n${detailsText}\n\n⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;

  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT,
        text: text.slice(0, 4000),
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error('[alerter] не удалось отправить алёрт:', err);
  }
}

// Удобные хелперы
export const alertError = (title: string, details?: string | object, dedupKey?: string) =>
  sendAlert({ level: 'error', title, details, dedupKey });

export const alertWarn = (title: string, details?: string | object, dedupKey?: string) =>
  sendAlert({ level: 'warn', title, details, dedupKey });

export const alertInfo = (title: string, details?: string | object, dedupKey?: string) =>
  sendAlert({ level: 'info', title, details, dedupKey });
