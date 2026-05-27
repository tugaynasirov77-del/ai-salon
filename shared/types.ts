// Общие TypeScript интерфейсы для всей платформы

export type Channel = 'telegram' | 'max' | 'vk' | 'sms' | 'webchat' | 'avito';
export type NicheKey =
  | 'beauty_salon'
  | 'barbershop'
  | 'fitness'
  | 'clinic'
  | 'auto_service'
  | 'restaurant'
  | 'lawyer'
  | 'tutor'
  | 'other';
export type Intent = 'booking' | 'faq' | 'cancel' | 'general';
export type AppointmentStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface ISalonSettings {
  priceList?: Array<{ service: string; price: number; duration?: number }>;
  schedule?: { from: string; to: string; days?: string[] };
  masters?: Array<{ name: string; services?: string[] }>;
  faq?: Array<{ question: string; answer: string }>;
  [key: string]: any;
}

export interface ISalon {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  address?: string | null;
  niche: NicheKey;
  plan: string;
  telegramBotToken?: string | null;
  maxBotToken?: string | null;
  settings?: ISalonSettings | null;
  isActive: boolean;
  createdAt: Date;
}

export interface IClient {
  id: string;
  salonId: string;
  name?: string | null;
  phone?: string | null;
  telegramId?: string | null;
  maxId?: string | null;
  vkId?: string | null;
  avitoUserId?: string | null;
  avitoChatId?: string | null;
  webchatId?: string | null;
  preferredChannel: Channel;
  createdAt: Date;
}

export interface IAppointment {
  id: string;
  salonId: string;
  clientId: string;
  service: string;
  master?: string | null;
  datetime: Date;
  status: AppointmentStatus;
  reminder24h: boolean;
  reminder2h: boolean;
  createdAt: Date;
}

export interface IMessage {
  id: string;
  salonId: string;
  clientId: string;
  channel: Channel;
  direction: 'in' | 'out';
  text: string;
  intent?: Intent | null;
  createdAt: Date;
}

// Нормализованный формат входящего сообщения (из любого канала)
export interface IIncomingMessage {
  channel: Channel;
  externalUserId: string;     // chatId / phone / etc
  text: string;
  senderName?: string;
  phone?: string;
  imageUrls?: string[];       // URLs прикреплённых изображений (Vision)
  voiceUrl?: string;          // URL голосового сообщения (для Whisper-транскрипции)
  raw?: any;
}

// Конфиг ниши
export interface INiche {
  key: NicheKey;
  label: string;
  icon: string;
  systemPrompt: string;       // с плейсхолдерами {name}, {services}, {schedule}
  bookingFields: string[];    // какие поля собирать (service, datetime, master, ...)
  reminderTemplates: {
    h24: string;              // шаблон за 24 часа
    h2: string;               // шаблон за 2 часа
  };
  onboardingQuestions: string[];
  defaultFAQ: Array<{ question: string; answer: string }>;
}

// Распарсенное намерение записи
export interface IBookingIntent {
  service?: string;
  master?: string;
  datetime?: string;          // ISO или человекочитаемая
  comment?: string;
  isComplete: boolean;        // все ли обязательные поля заполнены
}

// Результат отправки через каскад каналов
export interface ICascadeResult {
  success: boolean;
  channel?: Channel;
  attemptedChannels: Channel[];
  error?: string;
}
