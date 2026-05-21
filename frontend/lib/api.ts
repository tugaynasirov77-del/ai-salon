// Все запросы к live-бэку https://api.ailiva.ru
// Источник правды по эндпоинтам — vault `06 Live Backend.md`.

import type {
  ISalon,
  IClient,
  IAppointment,
  IMessage,
  NicheKey,
  AppointmentStatus,
} from '@shared/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ailiva.ru';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_URL + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) {
    let msg = 'API error ' + res.status + ' on ' + path;
    try {
      const body = await res.json();
      if (body?.error) msg += ': ' + body.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(v)));
  }
  return parts.length ? '?' + parts.join('&') : '';
}

// ============================================================
// Дополнительные типы (которых нет в @shared/types)
// ============================================================

export interface IService {
  id: string;
  salonId: string;
  name: string;
  price: number;            // ₽, int
  durationMin?: number;
  isActive: boolean;
  createdAt: string;
  masters: Array<{ masterId: string }>;
}

export interface IMaster {
  id: string;
  salonId: string;
  name: string;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  services: Array<{ serviceId: string }>;
}

export interface IWorkingHour {
  id: string;
  salonId: string;
  masterId: string | null;
  weekday: number;          // 0=вс..6=сб
  fromMin: number;          // минуты от 00:00
  toMin: number;
}

export interface IFaq {
  id: string;
  salonId: string;
  question: string;
  answer: string;
  order: number;
  createdAt: string;
}

export interface IConversationItem {
  client: IClient;
  lastMessage: IMessage | null;
  messagesCount: number;
}

export interface IConversationDetail {
  client: IClient;
  messages: IMessage[];
  appointments: IAppointment[];
}

export interface IAnalytics {
  period: { from: string; to: string };
  clientsTotal: number;
  newClientsInPeriod: number;
  appointmentsTotal: number;
  appointmentsInPeriod: number;
  messagesInPeriod: number;
  revenue: number;
  conversion: number;       // 0..1
  byStatus: Array<{ status: AppointmentStatus; count: number }>;
  byDay: Array<{ day: string; count: number }>;
}

export interface IUsage {
  messages: number;
  tokens: number;
  estimatedCostUsd: number;
  cacheHitRate: number;
}

export interface ITestChatResponse {
  sessionId: string;
  reply: string;
  usage: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheCreateTokens: number };
  turns: number;
}

export interface IHealthStatus {
  ok: boolean;
  uptime?: number;
}

// ============================================================
// Салон
// ============================================================

export function createSalon(data: Partial<ISalon> & { niche: NicheKey }): Promise<ISalon> {
  return request<ISalon>('/api/salons', { method: 'POST', body: JSON.stringify(data) });
}

export function fetchSalon(id: string): Promise<ISalon> {
  return request<ISalon>('/api/salons/' + id);
}

export function updateSalon(id: string, data: Partial<ISalon>): Promise<ISalon> {
  return request<ISalon>('/api/salons/' + id, { method: 'PUT', body: JSON.stringify(data) });
}

export function connectTelegram(id: string, token: string): Promise<{ ok: boolean }> {
  return request('/api/salons/' + id + '/telegram/connect', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

// ============================================================
// Услуги
// ============================================================

export function fetchServices(salonId: string): Promise<IService[]> {
  return request('/api/salons/' + salonId + '/services');
}

export function createService(
  salonId: string,
  data: { name: string; price: number; durationMin?: number; masterIds?: string[] },
): Promise<IService> {
  return request('/api/salons/' + salonId + '/services', { method: 'POST', body: JSON.stringify(data) });
}

export function updateService(salonId: string, serviceId: string, data: Partial<IService> & { masterIds?: string[] }): Promise<IService> {
  return request('/api/salons/' + salonId + '/services/' + serviceId, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteService(salonId: string, serviceId: string): Promise<{ ok: boolean }> {
  return request('/api/salons/' + salonId + '/services/' + serviceId, { method: 'DELETE' });
}

// ============================================================
// Мастера
// ============================================================

export function fetchMasters(salonId: string): Promise<IMaster[]> {
  return request('/api/salons/' + salonId + '/masters');
}

export function createMaster(
  salonId: string,
  data: { name: string; phone?: string; serviceIds?: string[] },
): Promise<IMaster> {
  return request('/api/salons/' + salonId + '/masters', { method: 'POST', body: JSON.stringify(data) });
}

export function updateMaster(salonId: string, masterId: string, data: Partial<IMaster> & { serviceIds?: string[] }): Promise<IMaster> {
  return request('/api/salons/' + salonId + '/masters/' + masterId, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteMaster(salonId: string, masterId: string): Promise<{ ok: boolean }> {
  return request('/api/salons/' + salonId + '/masters/' + masterId, { method: 'DELETE' });
}

// ============================================================
// Расписание (working hours)
// ============================================================

export function fetchWorkingHours(salonId: string, masterId: string | null = null): Promise<IWorkingHour[]> {
  return request('/api/salons/' + salonId + '/working-hours' + qs({ masterId: masterId === null ? 'null' : masterId }));
}

export function saveWorkingHours(
  salonId: string,
  masterId: string | null,
  hours: Array<{ weekday: number; fromMin: number; toMin: number }>,
): Promise<{ ok: boolean }> {
  return request('/api/salons/' + salonId + '/working-hours', {
    method: 'PUT',
    body: JSON.stringify({ masterId, hours }),
  });
}

// ============================================================
// FAQ
// ============================================================

export function fetchFaqs(salonId: string): Promise<IFaq[]> {
  return request('/api/salons/' + salonId + '/faqs');
}

export function createFaq(salonId: string, data: { question: string; answer: string; order?: number }): Promise<IFaq> {
  return request('/api/salons/' + salonId + '/faqs', { method: 'POST', body: JSON.stringify(data) });
}

export function updateFaq(salonId: string, faqId: string, data: Partial<IFaq>): Promise<IFaq> {
  return request('/api/salons/' + salonId + '/faqs/' + faqId, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteFaq(salonId: string, faqId: string): Promise<{ ok: boolean }> {
  return request('/api/salons/' + salonId + '/faqs/' + faqId, { method: 'DELETE' });
}

// ============================================================
// Записи
// ============================================================

export interface AppointmentsFilter {
  status?: AppointmentStatus;
  from?: string;            // ISO
  to?: string;
  masterId?: string;
  serviceId?: string;
  clientId?: string;
}

export function fetchAppointments(salonId: string, filter: AppointmentsFilter = {}): Promise<IAppointment[]> {
  return request('/api/salons/' + salonId + '/appointments' + qs(filter as any));
}

export function createAppointment(
  data: { salonId: string; clientId: string; service: string; datetime: string; master?: string },
): Promise<IAppointment> {
  return request('/api/appointments', { method: 'POST', body: JSON.stringify(data) });
}

export function updateAppointment(
  id: string,
  data: { service?: string; master?: string; serviceId?: string; masterId?: string; datetime?: string; status?: AppointmentStatus },
): Promise<IAppointment> {
  return request('/api/appointments/' + id, { method: 'PUT', body: JSON.stringify(data) });
}

export function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<IAppointment> {
  return request('/api/appointments/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status }) });
}

export function deleteAppointment(id: string): Promise<{ ok: boolean }> {
  return request('/api/appointments/' + id, { method: 'DELETE' });
}

// ============================================================
// Диалоги (Conversations)
// ============================================================

export function fetchConversations(salonId: string): Promise<IConversationItem[]> {
  return request('/api/salons/' + salonId + '/conversations');
}

export function fetchConversationDetail(salonId: string, clientId: string): Promise<IConversationDetail> {
  return request('/api/salons/' + salonId + '/conversations/' + clientId);
}

export function fetchClients(salonId: string): Promise<IClient[]> {
  return request('/api/salons/' + salonId + '/clients');
}

export function fetchMessages(salonId: string, clientId?: string): Promise<IMessage[]> {
  return request('/api/salons/' + salonId + '/messages' + qs({ clientId }));
}

// ============================================================
// Аналитика и расход токенов
// ============================================================

export function fetchAnalytics(salonId: string, range?: { from?: string; to?: string }): Promise<IAnalytics> {
  return request('/api/salons/' + salonId + '/analytics' + qs(range || {}));
}

export function fetchUsage(salonId: string, range?: { from?: string; to?: string }): Promise<IUsage> {
  return request('/api/salons/' + salonId + '/usage' + qs(range || {}));
}

// ============================================================
// Тестовый чат (редактор бота)
// ============================================================

export function sendTestChat(salonId: string, text: string, sessionId?: string): Promise<ITestChatResponse> {
  return request('/api/salons/' + salonId + '/test-chat', {
    method: 'POST',
    body: JSON.stringify({ text, sessionId }),
  });
}

export function resetTestChat(salonId: string, sessionId: string): Promise<{ ok: boolean }> {
  return request('/api/salons/' + salonId + '/test-chat/' + sessionId, { method: 'DELETE' });
}

// ============================================================
// Health
// ============================================================

export function checkHealth(): Promise<IHealthStatus> {
  return request('/health');
}
