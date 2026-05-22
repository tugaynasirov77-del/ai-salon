// Max (бывший TamTam) Bot API: https://dev.max.ru/docs-api
// Base: https://botapi.max.ru. Auth: access_token в query.
// Используем то же поле bot-token-per-salon, что и Telegram (multi-tenant).
import prisma from '../db/prisma';

const API_BASE = process.env.MAX_API_BASE || 'https://botapi.max.ru';

async function maxRequest<T = any>(
  token: string,
  method: 'GET' | 'POST',
  path: string,
  query: Record<string, string | number | undefined> = {},
  body?: any
): Promise<T> {
  const url = new URL(API_BASE + path);
  url.searchParams.set('access_token', token);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Max API ${path} ${res.status}: ${data?.message || JSON.stringify(data)}`);
  }
  return data;
}

// Отправка сообщения пользователю
export async function sendMessage(token: string, userId: string, text: string): Promise<boolean> {
  try {
    await maxRequest(token, 'POST', '/messages', { user_id: userId }, { text });
    return true;
  } catch (err) {
    console.error('[max.sendMessage] error:', err);
    return false;
  }
}

// Подписаться на webhook от Max-бота (vs polling).
// Max называет это «subscription».
export async function setWebhookForSalon(salonId: string, token: string, baseUrl: string): Promise<void> {
  const url = `${baseUrl}/webhook/max/${salonId}`;
  await maxRequest(token, 'POST', '/subscriptions', {}, {
    url,
    update_types: ['message_created'],
  });
  console.log(`[max] webhook установлен для салона ${salonId}: ${url}`);
}

// Получить инфо бота — валидируем токен при подключении
export async function getBotInfo(token: string): Promise<{ user_id: number; name: string; username?: string }> {
  return maxRequest(token, 'GET', '/me');
}

// Инициализация всех ботов на старте — переустанавливаем webhook'и
export async function initAllSalonBots(): Promise<void> {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    console.warn('[max] BASE_URL не задан, инициализация пропущена');
    return;
  }
  const salons = await prisma.salon.findMany({
    where: { maxBotToken: { not: null }, isActive: true },
  });
  let count = 0;
  for (const salon of salons) {
    try {
      if (!salon.maxBotToken) continue;
      await setWebhookForSalon(salon.id, salon.maxBotToken, baseUrl);
      count++;
    } catch (err) {
      console.error(`[max] не удалось установить webhook для салона ${salon.id}:`, err);
    }
  }
  console.log(`[max] инициализировано ботов: ${count}`);
}
