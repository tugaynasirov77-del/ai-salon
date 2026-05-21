import TelegramBot from 'node-telegram-bot-api';

let botInstance: TelegramBot | null = null;

// Инициализация Telegram-бота (webhook режим в проде)
export function initTelegramBot(): TelegramBot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN не задан — Telegram канал отключён');
    return null;
  }

  if (botInstance) return botInstance;

  botInstance = new TelegramBot(token, { polling: false });

  const baseUrl = process.env.BASE_URL;
  if (baseUrl) {
    const webhookUrl = `${baseUrl}/webhook/telegram`;
    botInstance
      .setWebHook(webhookUrl)
      .then(() => console.log(`[telegram] webhook установлен: ${webhookUrl}`))
      .catch((e) => console.error('[telegram] setWebHook error:', e?.message));
  }

  return botInstance;
}

export function getBot(): TelegramBot | null {
  return botInstance;
}

// Отправка сообщения в Telegram
export async function sendMessage(chatId: string | number, text: string): Promise<boolean> {
  try {
    const bot = getBot() || initTelegramBot();
    if (!bot) return false;
    await bot.sendMessage(chatId, text);
    return true;
  } catch (err) {
    console.error('[telegram.sendMessage] error:', err);
    return false;
  }
}
