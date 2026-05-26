// Все запросы к live-бэку https://api.ailiva.ru через axios (lib/http.ts).
// JWT подкладывается интерсептором автоматически.

import { httpGet, httpPost, httpPut, httpDelete } from './http';
import type {
  ISalon,
  IClient,
  IAppointment,
  IMessage,
  NicheKey,
  AppointmentStatus,
} from '@shared/types';

// ============================================================
// Дополнительные типы
// ============================================================

export interface IService {
  id: string;
  salonId: string;
  name: string;
  price: number;
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
  weekday: number;
  fromMin: number;
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
  unreadCount?: number;
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
  conversion: number;
  byStatus: Array<{ status: AppointmentStatus; count: number }>;
  byDay: Array<{ day: string; count: number }>;
  topServices: Array<{ name: string; count: number; revenue: number }>;
  channelSources: Array<{ channel: string; count: number }>;
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
  turns: Array<{ role: 'user' | 'assistant'; text: string }>;
}

// ============================================================
// Салон
// ============================================================

export const createSalon = (data: Partial<ISalon> & { niche: NicheKey }) => httpPost<ISalon>('/api/salons', data);
export const fetchSalon = (id: string) => httpGet<ISalon>(`/api/salons/${id}`);
export const updateSalon = (id: string, data: Partial<ISalon>) => httpPut<ISalon>(`/api/salons/${id}`, data);

export const connectTelegram = (id: string, token: string) => httpPost<{ ok: boolean }>(`/api/salons/${id}/telegram/connect`, { token });
export const connectMax = (id: string, token: string) => httpPost<{ ok: boolean }>(`/api/salons/${id}/max/connect`, { token });
export const connectAvito = (id: string, body: { clientId: string; clientSecret: string; userId: string }) =>
  httpPost<{ ok: boolean }>(`/api/salons/${id}/avito/connect`, body);

// YClients двухшаговый: без companyId → step:'select_company', с companyId → {ok, mapping}
export interface IYclientsStep1 {
  step: 'select_company';
  companies: Array<{ id: number; title: string }>;
}
export interface IYclientsStep2 {
  ok: true;
  mapping: { servicesMatched: number; staffMatched: number };
}
export const connectYclients = (id: string, body: { login: string; password: string; companyId?: number }) =>
  httpPost<IYclientsStep1 | IYclientsStep2>(`/api/salons/${id}/yclients/connect`, body);

// Отключение каналов через отдельные endpoints — бэк сам снимает webhook + чистит креды.
export const disconnectTelegram = (id: string) => httpPost<{ ok: boolean }>(`/api/salons/${id}/telegram/disconnect`, {});
export const disconnectMax = (id: string) => httpPost<{ ok: boolean }>(`/api/salons/${id}/max/disconnect`, {});
export const disconnectAvito = (id: string) => httpPost<{ ok: boolean }>(`/api/salons/${id}/avito/disconnect`, {});
export const disconnectYclients = (id: string) => httpPost<{ ok: boolean }>(`/api/salons/${id}/yclients/disconnect`, {});

// ============================================================
// Услуги, мастера, расписание, FAQ
// ============================================================

export const fetchServices = (salonId: string) => httpGet<IService[]>(`/api/salons/${salonId}/services`);
export const createService = (salonId: string, data: { name: string; price: number; durationMin?: number; masterIds?: string[] }) =>
  httpPost<IService>(`/api/salons/${salonId}/services`, data);
export const updateService = (salonId: string, serviceId: string, data: Partial<IService> & { masterIds?: string[] }) =>
  httpPut<IService>(`/api/salons/${salonId}/services/${serviceId}`, data);
export const deleteService = (salonId: string, serviceId: string) =>
  httpDelete<{ ok: boolean }>(`/api/salons/${salonId}/services/${serviceId}`);

export const fetchMasters = (salonId: string) => httpGet<IMaster[]>(`/api/salons/${salonId}/masters`);
export const createMaster = (salonId: string, data: { name: string; phone?: string; serviceIds?: string[] }) =>
  httpPost<IMaster>(`/api/salons/${salonId}/masters`, data);
export const updateMaster = (salonId: string, masterId: string, data: Partial<IMaster> & { serviceIds?: string[] }) =>
  httpPut<IMaster>(`/api/salons/${salonId}/masters/${masterId}`, data);
export const deleteMaster = (salonId: string, masterId: string) =>
  httpDelete<{ ok: boolean }>(`/api/salons/${salonId}/masters/${masterId}`);

export const fetchWorkingHours = (salonId: string, masterId: string | null = null) =>
  httpGet<IWorkingHour[]>(`/api/salons/${salonId}/working-hours`, { masterId: masterId === null ? 'null' : masterId });
export const saveWorkingHours = (
  salonId: string,
  masterId: string | null,
  hours: Array<{ weekday: number; fromMin: number; toMin: number }>,
) => httpPut<{ ok: boolean }>(`/api/salons/${salonId}/working-hours`, { masterId, hours });

export const fetchFaqs = (salonId: string) => httpGet<IFaq[]>(`/api/salons/${salonId}/faqs`);
export const createFaq = (salonId: string, data: { question: string; answer: string; order?: number }) =>
  httpPost<IFaq>(`/api/salons/${salonId}/faqs`, data);
export const updateFaq = (salonId: string, faqId: string, data: Partial<IFaq>) =>
  httpPut<IFaq>(`/api/salons/${salonId}/faqs/${faqId}`, data);
export const deleteFaq = (salonId: string, faqId: string) =>
  httpDelete<{ ok: boolean }>(`/api/salons/${salonId}/faqs/${faqId}`);

// ============================================================
// Записи
// ============================================================

export interface AppointmentsFilter {
  status?: AppointmentStatus;
  from?: string;
  to?: string;
  masterId?: string;
  serviceId?: string;
  clientId?: string;
}

export const fetchAppointments = (salonId: string, filter: AppointmentsFilter = {}) =>
  httpGet<IAppointment[]>(`/api/salons/${salonId}/appointments`, filter);

export const createAppointment = (data: { salonId: string; clientId: string; service: string; datetime: string; master?: string }) =>
  httpPost<IAppointment>('/api/appointments', data);

export const updateAppointment = (
  id: string,
  data: { service?: string; master?: string; serviceId?: string; masterId?: string; datetime?: string; status?: AppointmentStatus },
) => httpPut<IAppointment>(`/api/appointments/${id}`, data);

export const updateAppointmentStatus = (id: string, status: AppointmentStatus) =>
  httpPut<IAppointment>(`/api/appointments/${id}/status`, { status });

export const deleteAppointment = (id: string) => httpDelete<{ ok: boolean }>(`/api/appointments/${id}`);

// ============================================================
// Диалоги
// ============================================================

export const fetchConversations = (salonId: string) =>
  httpGet<IConversationItem[]>(`/api/salons/${salonId}/conversations`);
export const fetchConversationDetail = (salonId: string, clientId: string) =>
  httpGet<IConversationDetail>(`/api/salons/${salonId}/conversations/${clientId}`);

// Ручной ответ владельца. Бэк отправит через cascadeSender по preferredChannel клиента,
// сохранит Message с sentByOwner=true и автоматически пометит входящие как прочитанные.
export interface ISendMessageResponse {
  ok: boolean;
  message: IMessage & { sentByOwner: boolean };
  delivery: { channel: string; attempted: string[]; error: string | null };
}
export const sendOwnerMessage = (salonId: string, clientId: string, text: string) =>
  httpPost<ISendMessageResponse>(`/api/salons/${salonId}/conversations/${clientId}/message`, { text });

export const markConversationRead = (salonId: string, clientId: string) =>
  httpPost<{ ok: boolean; marked: number }>(`/api/salons/${salonId}/conversations/${clientId}/read`, {});
export const fetchClients = (salonId: string) => httpGet<IClient[]>(`/api/salons/${salonId}/clients`);
export const fetchMessages = (salonId: string, clientId?: string) =>
  httpGet<IMessage[]>(`/api/salons/${salonId}/messages`, { clientId });

// ============================================================
// Аналитика
// ============================================================

export const fetchAnalytics = (salonId: string, range?: { from?: string; to?: string }) =>
  httpGet<IAnalytics>(`/api/salons/${salonId}/analytics`, range);
export const fetchUsage = (salonId: string, range?: { from?: string; to?: string }) =>
  httpGet<IUsage>(`/api/salons/${salonId}/usage`, range);

// ============================================================
// Тестовый чат
// ============================================================

export const sendTestChat = (salonId: string, text: string, sessionId?: string) =>
  httpPost<ITestChatResponse>(`/api/salons/${salonId}/test-chat`, { text, sessionId });
export const resetTestChat = (salonId: string, sessionId: string) =>
  httpDelete<{ ok: boolean }>(`/api/salons/${salonId}/test-chat/${sessionId}`);

// ============================================================
// Заявки с лендинга (тариф «Под ключ»)
// ============================================================

export interface ILeadPayload {
  name: string;
  phone: string;
  niche?: string;
  city?: string;
  comment?: string;
  source?: string; // 'landing-pricing-turnkey' и т.п.
}
export const submitLead = (data: ILeadPayload) => httpPost<{ ok: boolean }>('/api/leads', data);

// ============================================================
// Health
// ============================================================

export const checkHealth = () => httpGet<{ status: string; services?: any }>('/health');
