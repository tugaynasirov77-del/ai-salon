import Anthropic from '@anthropic-ai/sdk';
import prisma from '../db/prisma';
import { buildSystemPrompt } from '../../../shared/niches';
import { scheduleReminders } from '../queues/reminderWorker';
import {
  IClient,
  IIncomingMessage,
  ISalon,
  Intent,
  NicheKey,
  ISalonSettings,
  IAppointment,
} from '../../../shared/types';

// Модель и провайдер — настраиваются через env (для прокси через OpenRouter из РФ)
const MODEL = process.env.LLM_MODEL || 'claude-haiku-4-5-20251001';
const LLM_BASE_URL = process.env.LLM_BASE_URL; // если задан — идём через прокси (OpenRouter)
const HISTORY_LIMIT = 10;
const MAX_MSG_LEN = 2000;
const MAX_TOOL_ROUNDS = 3;

export type AggregateUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreateTokens: number;
};

// Tools — Claude сам вызывает когда понимает намерение клиента
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'check_availability',
    description:
      'Проверить занятость слота перед записью. Вызывай ПЕРЕД create_appointment когда знаешь дату и время. Возвращает busy:true если слот занят (тогда предложи альтернативу) или busy:false если свободно.',
    input_schema: {
      type: 'object',
      properties: {
        datetime_iso: {
          type: 'string',
          description: 'Дата и время для проверки в ISO 8601, например 2026-05-22T15:00',
        },
        master: {
          type: 'string',
          description: 'Имя мастера (если клиент указал конкретного). Необязательно — если не указан, проверяем общую загрузку.',
        },
      },
      required: ['datetime_iso'],
    },
  },
  {
    name: 'create_appointment',
    description:
      'Создать запись клиента на услугу. Вызывай только когда собрал все обязательные поля: услугу из прайса, дату и время. Желательно сначала вызвать check_availability.',
    input_schema: {
      type: 'object',
      properties: {
        service: {
          type: 'string',
          description: 'Название услуги из прайс-листа салона (точно как в прайсе)',
        },
        datetime_iso: {
          type: 'string',
          description:
            'Дата и время записи в формате ISO 8601 без таймзоны, например 2026-05-22T15:00. Используй текущую дату из системного промпта.',
        },
        master: {
          type: 'string',
          description: 'Имя мастера (если клиент указал конкретного). Необязательно.',
        },
        comment: {
          type: 'string',
          description: 'Дополнительный комментарий клиента к записи. Необязательно.',
        },
      },
      required: ['service', 'datetime_iso'],
    },
  },
  {
    name: 'cancel_appointment',
    description:
      'Отменить существующую запись клиента. Вызывай когда клиент явно просит отмену. Найдёт ближайшую будущую активную запись этого клиента.',
    input_schema: {
      type: 'object',
      properties: {
        datetime_hint: {
          type: 'string',
          description: 'ISO дата-время если клиент указал какую именно запись отменить. Необязательно — если не указано, отменяется ближайшая будущая.',
        },
        reason: {
          type: 'string',
          description: 'Причина отмены если клиент назвал. Необязательно.',
        },
      },
      required: [],
    },
  },
  {
    name: 'reschedule_appointment',
    description:
      'Перенести существующую запись клиента на другое время. Сначала вызови check_availability для нового времени, потом этот tool. Найдёт ближайшую будущую запись.',
    input_schema: {
      type: 'object',
      properties: {
        new_datetime_iso: {
          type: 'string',
          description: 'Новая дата и время в ISO 8601',
        },
        datetime_hint: {
          type: 'string',
          description: 'ISO старой даты-времени если клиент указал какую запись переносить. Необязательно.',
        },
      },
      required: ['new_datetime_iso'],
    },
  },
];

const SLOT_BUSY_WINDOW_MIN = 60; // считаем слот занятым если в пределах 60 минут есть другая confirmed запись

export class AIAgent {
  private _client: Anthropic | null = null;
  private explicitKey?: string;

  constructor(apiKey?: string) {
    this.explicitKey = apiKey;
  }

  private get client(): Anthropic {
    if (!this._client) {
      const key = this.explicitKey || process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || '';
      if (!key) throw new Error('LLM API ключ не задан в окружении');
      const opts: ConstructorParameters<typeof Anthropic>[0] = { apiKey: key };
      if (LLM_BASE_URL) {
        // OpenRouter и подобные прокси требуют Authorization: Bearer вместо x-api-key
        opts.baseURL = LLM_BASE_URL;
        opts.defaultHeaders = { Authorization: `Bearer ${key}` };
      }
      this._client = new Anthropic(opts);
    }
    return this._client;
  }

  // Основной обработчик: формирует ответ AI на сообщение клиента
  async process(
    client: IClient,
    message: IIncomingMessage,
    salon: ISalon
  ): Promise<{ text: string; usage: AggregateUsage }> {
    const usage: AggregateUsage = {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheCreateTokens: 0,
    };
    try {
      // FAQ-shortcut: если короткий вопрос точно матчится с FAQ — отвечаем без Claude (экономия)
      const settingsEarly: ISalonSettings = (salon.settings as ISalonSettings) || {};
      const faqAnswer = this.tryFaqMatch(message.text, settingsEarly);
      if (faqAnswer) {
        console.log(`[aiAgent] FAQ-hit for salon=${salon.id}`);
        return { text: faqAnswer, usage };
      }

      const history = await prisma.message.findMany({
        where: { clientId: client.id, salonId: salon.id },
        orderBy: { createdAt: 'desc' },
        take: HISTORY_LIMIT,
      });
      history.reverse();

      const settings: ISalonSettings = (salon.settings as ISalonSettings) || {};
      // Стабильная часть system — кэшируется per salon (cache hit ≥80% на активных салонах)
      const stableSystem =
        buildSystemPrompt(salon.niche as NicheKey, {
          name: salon.name,
          services: this.formatServices(settings),
          schedule: this.formatSchedule(settings),
        }) +
        `\n\nКогда клиент явно подтвердил желание записаться И ты знаешь услугу, дату и время — ОБЯЗАТЕЛЬНО вызови инструмент create_appointment. Не пиши «запись оформлена», пока не вызвал инструмент.`;
      // Переменная часть — НЕ кэшируется (дата/клиент меняются)
      const volatileSystem =
        `Текущая дата: ${new Date().toISOString().slice(0, 10)} (UTC, только день).\n` +
        `Имя клиента в системе: ${client.name || '(не указано)'}.`;

      const messages: Anthropic.MessageParam[] = history.map((m) => ({
        role: m.direction === 'in' ? 'user' : 'assistant',
        content: this.truncate(m.text),
      }));
      messages.push({ role: 'user', content: this.truncate(message.text) });

      // Цикл tool use: Claude может вызвать инструмент → исполняем → отдаём результат
      let finalText = '';
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const response = await this.client.messages.create({
          model: MODEL,
          max_tokens: 600,
          system: [
            { type: 'text', text: stableSystem, cache_control: { type: 'ephemeral' } },
            { type: 'text', text: volatileSystem },
          ],
          tools: TOOLS,
          messages,
        });

        this.accumulateUsage(usage, response.usage);
        this.logUsage(response.usage, salon.id);

        const toolUses = response.content.filter((b) => b.type === 'tool_use') as Anthropic.ToolUseBlock[];

        if (toolUses.length === 0 || response.stop_reason !== 'tool_use') {
          finalText = response.content
            .filter((b) => b.type === 'text')
            .map((b) => (b as Anthropic.TextBlock).text)
            .join('\n')
            .trim();
          break;
        }

        // Добавляем ответ ассистента (с tool_use) в историю
        messages.push({ role: 'assistant', content: response.content });

        // Исполняем все вызовы инструментов
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const tu of toolUses) {
          const result = await this.executeTool(tu, client, salon);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: tu.id,
            content: result.content,
            is_error: result.isError,
          });
        }
        messages.push({ role: 'user', content: toolResults });
      }

      return {
        text: finalText || 'Извините, не могу сейчас ответить. Перезвоните нам.',
        usage,
      };
    } catch (err) {
      console.error('[aiAgent.process] error:', err);
      return { text: 'Извините, произошла ошибка. Попробуйте написать ещё раз.', usage };
    }
  }

  private accumulateUsage(acc: AggregateUsage, u: Anthropic.Usage | undefined): void {
    if (!u) return;
    acc.inputTokens += u.input_tokens || 0;
    acc.outputTokens += u.output_tokens || 0;
    acc.cacheReadTokens += (u as any).cache_read_input_tokens || 0;
    acc.cacheCreateTokens += (u as any).cache_creation_input_tokens || 0;
  }

  // Выполнение инструмента, который вызвал Claude
  private async executeTool(
    tu: Anthropic.ToolUseBlock,
    client: IClient,
    salon: ISalon
  ): Promise<{ content: string; isError: boolean }> {
    try {
      switch (tu.name) {
        case 'check_availability':
          return await this.toolCheckAvailability(tu.input as any, salon);
        case 'create_appointment':
          return await this.toolCreateAppointment(tu.input as any, client, salon);
        case 'cancel_appointment':
          return await this.toolCancelAppointment(tu.input as any, client, salon);
        case 'reschedule_appointment':
          return await this.toolRescheduleAppointment(tu.input as any, client, salon);
      }
    } catch (e: any) {
      console.error(`[aiAgent.executeTool ${tu.name}] error:`, e);
      return { content: `Ошибка выполнения: ${e?.message || 'unknown'}`, isError: true };
    }
    return { content: `Неизвестный инструмент: ${tu.name}`, isError: true };
  }

  private async toolCheckAvailability(
    input: { datetime_iso: string; master?: string },
    salon: ISalon
  ): Promise<{ content: string; isError: boolean }> {
    const datetime = new Date(input.datetime_iso);
    if (isNaN(datetime.getTime())) {
      return { content: 'Ошибка: некорректный формат datetime_iso', isError: true };
    }
    // Ищем confirmed записи в пределах окна вокруг указанного времени
    const windowMs = SLOT_BUSY_WINDOW_MIN * 60 * 1000;
    const where: any = {
      salonId: salon.id,
      status: 'confirmed',
      datetime: {
        gte: new Date(datetime.getTime() - windowMs),
        lte: new Date(datetime.getTime() + windowMs),
      },
    };
    if (input.master) where.master = input.master;
    const conflict = await prisma.appointment.findFirst({ where, orderBy: { datetime: 'asc' } });
    if (conflict) {
      return {
        content: JSON.stringify({
          busy: true,
          conflict_time: conflict.datetime.toLocaleString('ru-RU'),
          conflict_service: conflict.service,
        }),
        isError: false,
      };
    }
    return { content: JSON.stringify({ busy: false }), isError: false };
  }

  private async toolCreateAppointment(
    input: { service: string; datetime_iso: string; master?: string; comment?: string },
    client: IClient,
    salon: ISalon
  ): Promise<{ content: string; isError: boolean }> {
    const datetime = new Date(input.datetime_iso);
    if (isNaN(datetime.getTime())) {
      return { content: 'Ошибка: некорректный формат datetime_iso', isError: true };
    }
    const appointment = await prisma.appointment.create({
      data: {
        salonId: salon.id,
        clientId: client.id,
        service: input.service,
        master: input.master || null,
        datetime,
        status: 'confirmed',
      },
    });
    await scheduleReminders(appointment as unknown as IAppointment);
    console.log(`[aiAgent] создана запись ${appointment.id} для ${client.id}`);
    return {
      content: `Запись создана. ID: ${appointment.id}. ${input.service}, ${datetime.toLocaleString('ru-RU')}.`,
      isError: false,
    };
  }

  private async toolCancelAppointment(
    input: { datetime_hint?: string; reason?: string },
    client: IClient,
    salon: ISalon
  ): Promise<{ content: string; isError: boolean }> {
    const where: any = {
      salonId: salon.id,
      clientId: client.id,
      status: 'confirmed',
      datetime: { gte: new Date() }, // только будущие
    };
    if (input.datetime_hint) {
      const hint = new Date(input.datetime_hint);
      if (!isNaN(hint.getTime())) {
        const w = 12 * 60 * 60 * 1000; // ±12ч окно для поиска
        where.datetime = { gte: new Date(hint.getTime() - w), lte: new Date(hint.getTime() + w) };
      }
    }
    const appointment = await prisma.appointment.findFirst({ where, orderBy: { datetime: 'asc' } });
    if (!appointment) {
      return { content: 'У вас нет активных записей для отмены.', isError: false };
    }
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'cancelled' },
    });
    console.log(`[aiAgent] отменена запись ${appointment.id}`);
    return {
      content: `Запись отменена. Была: ${appointment.service}, ${appointment.datetime.toLocaleString('ru-RU')}.`,
      isError: false,
    };
  }

  private async toolRescheduleAppointment(
    input: { new_datetime_iso: string; datetime_hint?: string },
    client: IClient,
    salon: ISalon
  ): Promise<{ content: string; isError: boolean }> {
    const newDt = new Date(input.new_datetime_iso);
    if (isNaN(newDt.getTime())) {
      return { content: 'Ошибка: некорректный формат new_datetime_iso', isError: true };
    }
    const where: any = {
      salonId: salon.id,
      clientId: client.id,
      status: 'confirmed',
      datetime: { gte: new Date() },
    };
    if (input.datetime_hint) {
      const hint = new Date(input.datetime_hint);
      if (!isNaN(hint.getTime())) {
        const w = 12 * 60 * 60 * 1000;
        where.datetime = { gte: new Date(hint.getTime() - w), lte: new Date(hint.getTime() + w) };
      }
    }
    const appointment = await prisma.appointment.findFirst({ where, orderBy: { datetime: 'asc' } });
    if (!appointment) {
      return { content: 'У вас нет активных записей для переноса.', isError: false };
    }
    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { datetime: newDt, reminder24h: false, reminder2h: false },
    });
    await scheduleReminders(updated as unknown as IAppointment);
    console.log(`[aiAgent] перенесена запись ${appointment.id} на ${newDt.toISOString()}`);
    return {
      content: `Запись перенесена. ${updated.service}: было ${appointment.datetime.toLocaleString('ru-RU')}, стало ${newDt.toLocaleString('ru-RU')}.`,
      isError: false,
    };
  }

  // Простой матч FAQ: ищем пересечение значимых слов вопроса клиента с FAQ-вопросами салона.
  // Возвращает ответ если совпадение сильное (>=60% значимых слов).
  private tryFaqMatch(text: string, settings: ISalonSettings): string | null {
    const faq = settings?.faq;
    if (!faq || !Array.isArray(faq) || faq.length === 0) return null;
    if (text.length > 100) return null; // FAQ только для коротких вопросов

    const normalize = (s: string) =>
      s.toLowerCase().replace(/[^a-zа-яё0-9\s]/gi, ' ').split(/\s+/).filter((w) => w.length > 3);

    const qWords = new Set(normalize(text));
    if (qWords.size < 1) return null;

    let bestScore = 0;
    let bestAnswer: string | null = null;
    for (const item of faq) {
      const fqWords = normalize(item.question);
      if (fqWords.length === 0) continue;
      const matched = fqWords.filter((w) => qWords.has(w)).length;
      const score = matched / fqWords.length;
      if (score > bestScore) {
        bestScore = score;
        bestAnswer = item.answer;
      }
    }
    return bestScore >= 0.6 ? bestAnswer : null;
  }

  // Определение намерения для аналитики (поле Message.intent)
  detectIntent(text: string): Intent {
    const t = text.toLowerCase();
    if (/(запис|записаться|свободно|есть окошко|можно прийти|хочу попасть)/.test(t)) return 'booking';
    if (/(отмен|не приду|перенест|сдвинуть)/.test(t)) return 'cancel';
    if (/(цена|стоимость|сколько стоит|адрес|время работы|график|часы)/.test(t)) return 'faq';
    return 'general';
  }

  private logUsage(usage: Anthropic.Usage | undefined, salonId: string): void {
    if (!usage) return;
    const cacheRead = (usage as any).cache_read_input_tokens || 0;
    const cacheCreate = (usage as any).cache_creation_input_tokens || 0;
    console.log(
      `[usage salon=${salonId}] in=${usage.input_tokens} out=${usage.output_tokens} cache_read=${cacheRead} cache_create=${cacheCreate}`
    );
  }

  private truncate(text: string): string {
    if (text.length <= MAX_MSG_LEN) return text;
    return text.slice(0, MAX_MSG_LEN) + ' […]';
  }

  private formatServices(settings: ISalonSettings): string {
    if (!settings?.priceList || !Array.isArray(settings.priceList)) return '(не указано)';
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
