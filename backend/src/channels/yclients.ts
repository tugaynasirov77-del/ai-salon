// Интеграция с YClients API (https://api.yclients.com).
// Двухуровневая авторизация: Bearer <partner_token>, User <user_token>.
// partner_token — один на платформу (env), user_token — per salon в БД.
import prisma from '../db/prisma';

const API_BASE = process.env.YCLIENTS_API_BASE || 'https://api.yclients.com/api/v1';
const PARTNER_TOKEN = process.env.YCLIENTS_PARTNER_TOKEN || '';

export type YClientsCreds = {
  companyId: string;
  userToken: string;
};

function authHeader(creds?: YClientsCreds): string {
  const partner = `Bearer ${PARTNER_TOKEN}`;
  return creds ? `${partner}, User ${creds.userToken}` : partner;
}

async function yclientsRequest<T = any>(
  path: string,
  init: { method?: string; body?: any; creds?: YClientsCreds } = {}
): Promise<T> {
  if (!PARTNER_TOKEN) {
    throw new Error('YCLIENTS_PARTNER_TOKEN не задан в env');
  }
  const res = await fetch(API_BASE + path, {
    method: init.method || 'GET',
    headers: {
      Accept: 'application/vnd.yclients.v2+json',
      'Content-Type': 'application/json',
      Authorization: authHeader(init.creds),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    const msg = data?.meta?.message || data?.message || `HTTP ${res.status}`;
    throw new Error(`YClients ${path}: ${msg}`);
  }
  return data;
}

// ───── Авторизация пользователя по логину/паролю ─────
// Используется при первом подключении салона: владелец вводит свой логин YClients,
// мы получаем user_token и сохраняем.
export async function authUser(login: string, password: string): Promise<{
  user_token: string;
  id: number;
  name?: string;
}> {
  const data = await yclientsRequest('/auth', {
    method: 'POST',
    body: { login, password },
  });
  if (!data?.data?.user_token) {
    throw new Error('YClients auth: нет user_token в ответе');
  }
  return data.data;
}

// ───── Список компаний (филиалов) пользователя ─────
export async function getUserCompanies(creds: YClientsCreds): Promise<Array<{ id: number; title: string }>> {
  const data = await yclientsRequest('/companies?my=1', { creds });
  return data.data || [];
}

// ───── Услуги филиала ─────
export async function getServices(creds: YClientsCreds): Promise<Array<{
  id: number;
  title: string;
  price_min: number;
  price_max: number;
  duration: number; // в секундах
  staff: Array<{ id: number; name: string }>;
}>> {
  const data = await yclientsRequest(`/services/${creds.companyId}`, { creds });
  return data.data || [];
}

// ───── Сотрудники филиала ─────
export async function getStaff(creds: YClientsCreds): Promise<Array<{
  id: number;
  name: string;
  specialization?: string;
  position?: { id: number; title: string };
}>> {
  const data = await yclientsRequest(`/company/${creds.companyId}/staff`, { creds });
  return data.data || [];
}

// ───── Свободные даты у сотрудника ─────
export async function getBookDates(
  creds: YClientsCreds,
  staffId: number,
  serviceIds: number[]
): Promise<string[]> {
  const params = new URLSearchParams();
  serviceIds.forEach((id) => params.append('service_ids[]', String(id)));
  const data = await yclientsRequest(
    `/book_dates/${creds.companyId}?staff_id=${staffId}&${params}`,
    { creds }
  );
  return data.data?.booking_dates || [];
}

// ───── Создание записи (главное!) ─────
export type CreateRecordPayload = {
  staff_id: number;
  services: Array<{ id: number; cost?: number; discount?: number }>;
  client: { phone: string; name: string; email?: string };
  datetime: string; // ISO 8601 с таймзоной, например "2026-05-27T14:30:00+03:00"
  comment?: string;
  api_id?: string; // наш внутренний ID для трекинга
  attendance?: number; // -1=отменена, 0=ожидание, 1=пришёл, 2=подтверждена
};

export async function createRecord(
  creds: YClientsCreds,
  payload: CreateRecordPayload
): Promise<{ id: number }> {
  const data = await yclientsRequest(`/records/${creds.companyId}`, {
    method: 'POST',
    body: payload,
    creds,
  });
  return data.data;
}

// ───── Отмена записи ─────
export async function deleteRecord(creds: YClientsCreds, recordId: number): Promise<void> {
  await yclientsRequest(`/record/${creds.companyId}/${recordId}`, {
    method: 'DELETE',
    creds,
  });
}

// ───── Обновление записи (перенос времени) ─────
export async function updateRecord(
  creds: YClientsCreds,
  recordId: number,
  patch: Partial<CreateRecordPayload>
): Promise<void> {
  await yclientsRequest(`/record/${creds.companyId}/${recordId}`, {
    method: 'PUT',
    body: patch,
    creds,
  });
}

// ───── Подключение салона: автомат-маппинг услуг/мастеров ─────
// После того как мы получили user_token + company_id — подтягиваем
// их услуги и мастеров, сопоставляем с нашими по названию (fuzzy).
export async function autoMapSalon(
  salonId: string,
  creds: YClientsCreds
): Promise<{ servicesMatched: number; staffMatched: number }> {
  const [yServices, yStaff, ourServices, ourMasters] = await Promise.all([
    getServices(creds),
    getStaff(creds),
    prisma.service.findMany({ where: { salonId } }),
    prisma.master.findMany({ where: { salonId } }),
  ]);

  const norm = (s: string) => s.toLowerCase().replace(/[^a-zа-яё0-9\s]/gi, '').trim();

  // Маппинг услуг по нормализованному названию
  const serviceMap: Record<string, number> = {}; // serviceId (наш) → yclients service.id
  for (const our of ourServices) {
    const target = norm(our.name);
    const match = yServices.find((s) => norm(s.title) === target);
    if (match) serviceMap[our.id] = match.id;
  }

  // Маппинг мастеров
  const staffMap: Record<string, number> = {}; // masterId (наш) → yclients staff.id
  for (const our of ourMasters) {
    const target = norm(our.name);
    const match = yStaff.find((s) => norm(s.name) === target);
    if (match) staffMap[our.id] = match.id;
  }

  await prisma.salon.update({
    where: { id: salonId },
    data: {
      yclientsServiceMap: serviceMap,
      yclientsStaffMap: staffMap,
    },
  });

  return {
    servicesMatched: Object.keys(serviceMap).length,
    staffMatched: Object.keys(staffMap).length,
  };
}

// ───── Helper: достать creds для салона из БД ─────
export async function getSalonCreds(salonId: string): Promise<YClientsCreds | null> {
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: { yclientsCompanyId: true, yclientsUserToken: true },
  });
  if (!salon?.yclientsCompanyId || !salon?.yclientsUserToken) return null;
  return { companyId: salon.yclientsCompanyId, userToken: salon.yclientsUserToken };
}
