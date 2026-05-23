// Авито Messenger API: https://developers.avito.ru/api-catalog/messenger/documentation
// OAuth client_credentials. Токен в Redis с TTL.
import redis from '../db/redis';

const API_BASE = process.env.AVITO_API_BASE || 'https://api.avito.ru';
const TOKEN_TTL_SAFETY = 60; // секунд запаса до истечения

export type AvitoCreds = {
  clientId: string;
  clientSecret: string;
  userId: string; // числовой ID аккаунта Авито
};

// ───── OAuth token (с кэшем в Redis) ─────
export async function getAccessToken(creds: AvitoCreds): Promise<string> {
  const cacheKey = `avito_token:${creds.clientId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
    }).toString(),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`Avito token error ${res.status}: ${data?.error_description || JSON.stringify(data)}`);
  }
  const ttl = Math.max(60, (data.expires_in || 86400) - TOKEN_TTL_SAFETY);
  await redis.set(cacheKey, data.access_token, 'EX', ttl);
  return data.access_token;
}

async function avitoRequest<T = any>(
  creds: AvitoCreds,
  method: 'GET' | 'POST',
  path: string,
  body?: any
): Promise<T> {
  const token = await getAccessToken(creds);
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Avito ${path} ${res.status}: ${data?.error?.message || JSON.stringify(data)}`);
  }
  return data;
}

// ───── Info об аккаунте — валидация при подключении ─────
export async function getSelfInfo(creds: AvitoCreds): Promise<any> {
  return avitoRequest(creds, 'GET', '/core/v1/accounts/self');
}

// ───── Отправка сообщения в чат ─────
export async function sendMessage(
  creds: AvitoCreds,
  chatId: string,
  text: string
): Promise<boolean> {
  try {
    await avitoRequest(
      creds,
      'POST',
      `/messenger/v1/accounts/${creds.userId}/chats/${chatId}/messages`,
      { message: { text }, type: 'text' }
    );
    return true;
  } catch (err) {
    console.error('[avito.sendMessage] error:', err);
    return false;
  }
}

// ───── Webhook subscribe ─────
export async function subscribeWebhook(creds: AvitoCreds, callbackUrl: string): Promise<void> {
  await avitoRequest(creds, 'POST', '/messenger/v3/webhook', { url: callbackUrl });
  console.log(`[avito] webhook подписан: ${callbackUrl}`);
}

export async function unsubscribeWebhook(creds: AvitoCreds, callbackUrl: string): Promise<void> {
  await avitoRequest(creds, 'POST', '/messenger/v1/webhook/unsubscribe', { url: callbackUrl }).catch(() => {});
}

// ───── Init на старте: переподписать webhook'и всех подключённых салонов ─────
import prisma from '../db/prisma';
export async function initAllSalonBots(): Promise<void> {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    console.warn('[avito] BASE_URL не задан, инициализация пропущена');
    return;
  }
  const salons = await prisma.salon.findMany({
    where: {
      isActive: true,
      avitoClientId: { not: null },
      avitoClientSecret: { not: null },
      avitoUserId: { not: null },
    },
  });
  let count = 0;
  for (const salon of salons) {
    try {
      const creds: AvitoCreds = {
        clientId: salon.avitoClientId!,
        clientSecret: salon.avitoClientSecret!,
        userId: salon.avitoUserId!,
      };
      await subscribeWebhook(creds, `${baseUrl}/webhook/avito/${salon.id}`);
      count++;
    } catch (err) {
      console.error(`[avito] не удалось подписать webhook для ${salon.id}:`, err);
    }
  }
  console.log(`[avito] инициализировано аккаунтов: ${count}`);
}
