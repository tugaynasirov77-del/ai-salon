import Anthropic from '@anthropic-ai/sdk';
import prisma from '../db/prisma';
import { buildSystemPrompt, NICHES } from '../../../shared/niches';
import {
  IClient,
  IIncomingMessage,
  ISalon,
  Intent,
  IBookingIntent,
  NicheKey,
  ISalonSettings,
} from '../../../shared/types';

const MODEL = 'claude-haiku-4-5-20251001';
const HISTORY_LIMIT = 10;

export class AIAgent {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY || '',
    });
  }

  // Основной обработчик: формирует ответ AI на сообщение клиента
  async process(client: IClient, message: IIncomingMessage, salon: ISalon): Promise<string> {
    try {
      // 1. История последних N сообщений
      const history = await prisma.message.findMany({
        where: { clientId: client.id, salonId: salon.id },
        orderBy: { createdAt: 'desc' },
        take: HISTORY_LIMIT,
      });
      history.reverse();

      // 2. Системный промпт из конфига ниши
      const settings: ISalonSettings = (salon.settings as ISalonSettings) || {};
      const servicesText = this.formatServices(settings);
      const scheduleText = this.formatSchedule(settings);
      const systemPrompt = buildSystemPrompt(salon.niche as NicheKey, {
        name: salon.name,
        services: servicesText,
        schedule: scheduleText,
      });

      // 3. Сборка истории для Claude
      const messages = history.map((m) => ({
        role: (m.direction === 'in' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }));
      messages.push({ role: 'user', content: message.text });

      // 4. Запрос в Claude с prompt caching на системном промпте
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 512,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages,
      });

      const replyText = response.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('\n')
        .trim();

      // 5. Если намерение — запись, пытаемся распарсить и создать
      const intent = this.detectIntent(message.text);
      if (intent === 'booking') {
        const booking = this.parseBookingIntent(message.text + '\n' + replyText);
        if (booking.isComplete && booking.service && booking.datetime) {
          try {
            await prisma.appointment.create({
              data: {
                salonId: salon.id,
                clientId: client.id,
                service: booking.service,
                master: booking.master || null,
                datetime: new Date(booking.datetime),
                status: 'confirmed',
              },
            });
          } catch (e) {
            console.error('[aiAgent] failed to create appointment:', e);
          }
        }
      }

      return replyText || 'Извините, не могу сейчас ответить. Перезвоните нам.';
    } catch (err) {
      console.error('[aiAgent.process] error:', err);
      return 'Извините, произошла ошибка. Попробуйте написать ещё раз.';
    }
  }

  // Определение намерения по ключевым словам
  detectIntent(text: string): Intent {
    const t = text.toLowerCase();
    if (/(запис|записаться|свободно|есть окошко|можно прийти|хочу попасть)/.test(t)) {
      return 'booking';
    }
    if (/(отмен|не приду|перенест|сдвинуть)/.test(t)) {
      return 'cancel';
    }
    if (/(цена|стоимость|сколько стоит|адрес|время работы|график|часы)/.test(t)) {
      return 'faq';
    }
    return 'general';
  }

  // Простой парсер намерения записи (эвристика; продакшн — через tool use)
  parseBookingIntent(text: string): IBookingIntent {
    const result: IBookingIntent = { isComplete: false };

    // Дата/время — ищем ISO или "DD.MM HH:MM"
    const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2})\b/);
    if (isoMatch) {
      result.datetime = isoMatch[1];
    } else {
      const dmMatch = text.match(/\b(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?\s+(\d{1,2}):(\d{2})/);
      if (dmMatch) {
        const [, d, m, y, hh, mm] = dmMatch;
        const year = y ? (y.length === 2 ? '20' + y : y) : new Date().getFullYear().toString();
        result.datetime = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${hh.padStart(2, '0')}:${mm}`;
      }
    }

    // Услуга — пока заглушка, в проде брать из tool-use результата
    const svc = text.match(/услуг[ауи]?\s*[:\-]?\s*([А-Яа-яёЁ\w\s]{2,40})/i);
    if (svc) result.service = svc[1].trim();

    result.isComplete = !!(result.service && result.datetime);
    return result;
  }

  private formatServices(settings: ISalonSettings): string {
    if (!settings?.priceList || !Array.isArray(settings.priceList)) {
      return '(не указано)';
    }
    return settings.priceList
      .map((p) => `• ${p.service} — ${p.price}₽${p.duration ? ` (${p.duration} мин)` : ''}`)
      .join('\n');
  }

  private formatSchedule(settings: ISalonSettings): string {
    if (!settings?.schedule) return '(не указан)';
    const s = settings.schedule;
    return `${s.from || '?'} – ${s.to || '?'}${s.days ? ` (${s.days.join(', ')})` : ''}`;
  }
}

export const aiAgent = new AIAgent();
