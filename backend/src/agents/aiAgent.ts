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

const MODEL = 'claude-haiku-4-5-20251001';
const HISTORY_LIMIT = 10;
const MAX_MSG_LEN = 2000;
const MAX_TOOL_ROUNDS = 3;

export type AggregateUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreateTokens: number;
};

// Tool — Claude сам вызывает когда понимает что клиент хочет записаться
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'create_appointment',
    description:
      'Создать запись клиента на услугу. Вызывай только когда собрал все обязательные поля: услугу из прайса, дату и время. Имя/телефон клиента уже есть в системе.',
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
            'Дата и время записи в формате ISO 8601 без таймзоны, например 2026-05-22T15:00. Используй текущую дату из системного промпта для разрешения слов "завтра", "послезавтра", "в пятницу" и т.п.',
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
];

export class AIAgent {
  private _client: Anthropic | null = null;
  private explicitKey?: string;

  constructor(apiKey?: string) {
    this.explicitKey = apiKey;
  }

  private get client(): Anthropic {
    if (!this._client) {
      const key = this.explicitKey || process.env.ANTHROPIC_API_KEY || '';
      if (!key) throw new Error('ANTHROPIC_API_KEY не задан в окружении');
      this._client = new Anthropic({ apiKey: key });
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
    if (tu.name === 'create_appointment') {
      const input = tu.input as {
        service: string;
        datetime_iso: string;
        master?: string;
        comment?: string;
      };
      try {
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
          content: `Запись успешно создана. ID: ${appointment.id}. Услуга: ${input.service}. Время: ${datetime.toLocaleString('ru-RU')}.`,
          isError: false,
        };
      } catch (e: any) {
        console.error('[aiAgent.executeTool] error:', e);
        return { content: `Ошибка создания записи: ${e?.message || 'unknown'}`, isError: true };
      }
    }
    return { content: `Неизвестный инструмент: ${tu.name}`, isError: true };
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
