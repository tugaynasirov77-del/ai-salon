import TelegramBot from 'node-telegram-bot-api';
import prisma from '../db/prisma';

// Менеджер инстансов ботов: один процесс — много салонов, у каждого свой токен.
// Ключ — токен бота, значение — клиент node-telegram-bot-api.
const bots = new Map<string, TelegramBot>();

// Получить (или создать) инстанс бота для отправки сообщений
export function getBot(token: string): TelegramBot {
  let bot = bots.get(token);
  if (!bot) {
    bot = new TelegramBot(token, { polling: false });
    bots.set(token, bot);
  }
  return bot;
}

// Установить webhook для конкретного салона
export async function setWebhookForSalon(
  salonId: string,
  token: string,
  baseUrl: string
): Promise<void> {
  const bot = getBot(token);
  const url = `${baseUrl}/webhook/telegram/${salonId}`;
  await bot.setWebHook(url);
  console.log(`[telegram] webhook установлен для салона ${salonId}: ${url}`);
}

// Отправка сообщения через бот конкретного салона
export async function sendMessage(token: string, chatId: string | number, text: string): Promise<boolean> {
  try {
    const bot = getBot(token);
    await bot.sendMessage(chatId, text);
    return true;
  } catch (err) {
    console.error('[telegram.sendMessage] error:', err);
    return false;
  }
}

// При старте сервера: восстановить webhook'и всех активных салонов с токеном
export async function initAllSalonBots(): Promise<void> {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    console.warn('[telegram] BASE_URL не задан — webhooks не установлены');
    return;
  }

  const salons = await prisma.salon.findMany({
    where: { isActive: true, telegramBotToken: { not: null } },
    select: { id: true, telegramBotToken: true },
  });

  for (const s of salons) {
    if (!s.telegramBotToken) continue;
    try {
      await setWebhookForSalon(s.id, s.telegramBotToken, baseUrl);
    } catch (e: any) {
      console.error(`[telegram] не удалось установить webhook для салона ${s.id}:`, e?.message);
    }
  }
  console.log(`[telegram] инициализировано ботов: ${salons.length}`);
}
