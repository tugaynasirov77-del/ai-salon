// Слой работы с API. Пока NEXT_PUBLIC_API_URL пустой — отдаём моки.
// Когда бэкенд задеплоят на Railway, переменная окружения переключит на реальный API.

import type {
  ISalon,
  IClient,
  IAppointment,
  IMessage,
  NicheKey,
  Channel,
  AppointmentStatus,
} from '@shared/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const USE_MOCKS = !API_URL;

export interface IAnalytics {
  bookingsToday: number;
  newClientsWeek: number;
  messagesToday: number;
  conversionRate: number;
  dialogsByDay: Array<{ date: string; dialogs: number; bookings: number }>;
  topServices: Array<{ service: string; count: number }>;
  channelSources: Array<{ channel: Channel; count: number }>;
}

export interface IHealthStatus {
  ok: boolean;
  uptime?: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_URL + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error('API error ' + res.status + ' on ' + path);
  return res.json() as Promise<T>;
}

// ---------- МОКИ ----------
const mockSalon: ISalon = {
  id: 'mock-salon-1',
  name: 'Демо Салон',
  ownerName: 'Иван Петров',
  phone: '+7 (999) 123-45-67',
  address: 'Москва, ул. Тверская, 1',
  niche: 'beauty_salon',
  plan: 'free',
  telegramBotToken: null,
  settings: null,
  isActive: true,
  createdAt: new Date(),
};

const mockClients: IClient[] = Array.from({ length: 8 }).map((_, i) => ({
  id: 'c' + i,
  salonId: 'mock-salon-1',
  name: ['Анна', 'Мария', 'Ольга', 'Елена', 'Дарья', 'Юлия', 'Кристина', 'Светлана'][i],
  phone: '+7 (999) 000-00-0' + i,
  telegramId: 'tg' + i,
  whatsappId: null,
  maxId: null,
  preferredChannel: (['telegram', 'whatsapp', 'sms'] as Channel[])[i % 3],
  createdAt: new Date(Date.now() - i * 86400000),
}));

const mockAppointments: IAppointment[] = [
  { id: 'a1', salonId: 'mock-salon-1', clientId: 'c0', service: 'Маникюр', master: 'Анна', datetime: new Date(new Date().setHours(10, 0, 0, 0)), status: 'confirmed', reminder24h: true, reminder2h: false, createdAt: new Date() },
  { id: 'a2', salonId: 'mock-salon-1', clientId: 'c1', service: 'Стрижка', master: 'Мария', datetime: new Date(new Date().setHours(12, 30, 0, 0)), status: 'completed', reminder24h: true, reminder2h: true, createdAt: new Date() },
  { id: 'a3', salonId: 'mock-salon-1', clientId: 'c2', service: 'Окрашивание', master: 'Анна', datetime: new Date(new Date().setHours(15, 0, 0, 0)), status: 'confirmed', reminder24h: false, reminder2h: false, createdAt: new Date() },
  { id: 'a4', salonId: 'mock-salon-1', clientId: 'c3', service: 'Педикюр', master: 'Ольга', datetime: new Date(new Date().setHours(17, 30, 0, 0)), status: 'no_show', reminder24h: true, reminder2h: true, createdAt: new Date() },
];

const mockMessages: IMessage[] = mockClients.map((c, i) => ({
  id: 'm' + i,
  salonId: 'mock-salon-1',
  clientId: c.id,
  channel: c.preferredChannel,
  direction: 'in',
  text: ['Здравствуйте, можно записаться?', 'Сколько стоит маникюр?', 'Хочу перенести запись', 'Спасибо!', 'Когда удобно в субботу?', 'А есть свободно завтра?', 'Подскажите цены', 'Можно к Анне?'][i],
  intent: null,
  createdAt: new Date(Date.now() - i * 1000 * 60 * 7),
}));

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

// ---------- ПУБЛИЧНЫЕ ФУНКЦИИ ----------
export function fetchSalon(id: string): Promise<ISalon> {
  if (USE_MOCKS) return delay({ ...mockSalon, id });
  return request<ISalon>('/api/salons/' + id);
}

export function updateSalon(id: string, data: Partial<ISalon>): Promise<ISalon> {
  if (USE_MOCKS) return delay({ ...mockSalon, ...data, id });
  return request<ISalon>('/api/salons/' + id, { method: 'PUT', body: JSON.stringify(data) });
}

export function createSalon(data: Partial<ISalon> & { niche: NicheKey }): Promise<ISalon> {
  if (USE_MOCKS) return delay({ ...mockSalon, ...data, id: 'new-' + Date.now() });
  return request<ISalon>('/api/salons', { method: 'POST', body: JSON.stringify(data) });
}

export function fetchClients(salonId: string): Promise<IClient[]> {
  if (USE_MOCKS) return delay(mockClients);
  return request<IClient[]>('/api/salons/' + salonId + '/clients');
}

export function fetchAppointments(salonId: string, date?: string): Promise<IAppointment[]> {
  if (USE_MOCKS) return delay(mockAppointments);
  const q = date ? '?date=' + encodeURIComponent(date) : '';
  return request<IAppointment[]>('/api/salons/' + salonId + '/appointments' + q);
}

export function createAppointment(data: Partial<IAppointment>): Promise<IAppointment> {
  if (USE_MOCKS) return delay({ ...mockAppointments[0], ...data, id: 'new-' + Date.now() } as IAppointment);
  return request<IAppointment>('/api/appointments', { method: 'POST', body: JSON.stringify(data) });
}

export function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<IAppointment> {
  if (USE_MOCKS) return delay({ ...mockAppointments[0], id, status });
  return request<IAppointment>('/api/appointments/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status }) });
}

export function fetchMessages(salonId: string): Promise<IMessage[]> {
  if (USE_MOCKS) return delay(mockMessages);
  return request<IMessage[]>('/api/salons/' + salonId + '/messages');
}

export function fetchAnalytics(salonId: string, period: '7d' | '30d' | '90d' = '7d'): Promise<IAnalytics> {
  if (USE_MOCKS) {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const dialogsByDay = Array.from({ length: days }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return {
        date: d.toISOString().slice(5, 10),
        dialogs: Math.floor(8 + Math.random() * 20),
        bookings: Math.floor(3 + Math.random() * 10),
      };
    });
    return delay({
      bookingsToday: 12,
      newClientsWeek: 34,
      messagesToday: 87,
      conversionRate: 0.42,
      dialogsByDay,
      topServices: [
        { service: 'Маникюр', count: 48 },
        { service: 'Стрижка', count: 36 },
        { service: 'Окрашивание', count: 22 },
        { service: 'Педикюр', count: 18 },
        { service: 'Брови', count: 12 },
      ],
      channelSources: [
        { channel: 'telegram', count: 64 },
        { channel: 'whatsapp', count: 28 },
        { channel: 'sms', count: 6 },
        { channel: 'max', count: 2 },
      ],
    });
  }
  return request<IAnalytics>('/api/salons/' + salonId + '/analytics?period=' + period);
}

export function checkHealth(): Promise<IHealthStatus> {
  if (USE_MOCKS) return delay({ ok: true, uptime: 12345 });
  return request<IHealthStatus>('/health');
}

// Проверка подключения Telegram бота (заглушка)
export function checkTelegramBot(): Promise<{ ok: boolean; botUrl?: string }> {
  if (USE_MOCKS) return delay({ ok: true, botUrl: 'https://t.me/demo_salon_bot' }, 1200);
  return request('/api/telegram/check');
}
