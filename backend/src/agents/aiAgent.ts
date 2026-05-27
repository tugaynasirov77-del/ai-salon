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
  IAppointment,
} from '../../../shared/types';
import type { Service, Master, WorkingHours, Faq } from '@prisma/client';

type SalonCrm = {
  services: Service[];
  masters: (Master & { services: { serviceId: string }[] })[];
  workingHours: WorkingHours[];
  faqs: Faq[];
};

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
      const crm = await this.loadSalonCrm(salon.id);

      // FAQ-shortcut: если короткий вопрос точно матчится с FAQ — отвечаем без Claude (экономия)
      const faqAnswer = this.tryFaqMatch(message.text, crm.faqs);
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

      // Стабильная часть system — кэшируется per salon (cache hit ≥80% на активных салонах)
      const stableSystem =
        buildSystemPrompt(salon.niche as NicheKey, {
          name: salon.name,
          services: this.formatServices(crm.services),
          schedule: this.formatSchedule(crm.workingHours),
        }) +
        `\n\nКогда клиент явно подтвердил желание записаться И ты знаешь услугу, дату и время — ОБЯЗАТЕЛЬНО вызови инструмент create_appointment. Не пиши «запись оформлена», пока не вызвал инструмент.\n\nПосле успешного вызова инструмента (create/cancel/reschedule) — сформулируй подтверждение СВОИМИ словами в стиле живого диалога. НЕ пиши "Запись создана. ID: ...". Пример хорошего ответа: "Готово, записал на завтра в 15:00 👍" или "Окей, отменил" — коротко, по-человечески.`;
      // Переменная часть — НЕ кэшируется (дата/клиент меняются)
      const clientContext = await this.buildClientContext(client.id, salon.id, client.name);
      const volatileSystem =
        `Текущая дата: ${new Date().toISOString().slice(0, 10)} (UTC, только день).\n` +
        `Имя клиента в системе: ${client.name || '(не указано)'}.\n` +
        clientContext;

      const messages: Anthropic.MessageParam[] = history.map((m) => ({
        role: m.direction === 'in' ? 'user' : 'assistant',
        content: this.truncate(m.text),
      }));

      // Vision: если есть прикреплённые изображения — формируем content как массив блоков
      if (message.imageUrls?.length) {
        const imageBlocks = await this.fetchImagesAsBlocks(message.imageUrls);
        const userContent: any[] = [
          ...imageBlocks,
          { type: 'text', text: this.truncate(message.text || '[изображение]') },
        ];
        messages.push({ role: 'user', content: userContent });
      } else {
        messages.push({ role: 'user', content: this.truncate(message.text) });
      }

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
    } catch (err: any) {
      console.error('[aiAgent.process] error:', err);
      // Алёрт владельцу платформы — LLM или БД упала, клиент не получает ответ
      import('../utils/alerter').then(({ alertError }) =>
        alertError(
          'AI Agent сбой',
          {
            salonId: salon.id,
            salon: salon.name,
            clientText: message.text.slice(0, 200),
            error: err?.message || String(err),
            stack: err?.stack?.split('\n').slice(0, 4).join('\n'),
          },
          `aiagent:${err?.status || err?.code || 'unknown'}`
        )
      );
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
    // Найти FK-связи: услуга по имени, мастер по имени (для CRM)
    const [serviceRef, masterRef] = await Promise.all([
      prisma.service.findFirst({ where: { salonId: salon.id, name: input.service } }),
      input.master
        ? prisma.master.findFirst({ where: { salonId: salon.id, name: input.master } })
        : Promise.resolve(null),
    ]);
    const appointment = await prisma.appointment.create({
      data: {
        salonId: salon.id,
        clientId: client.id,
        service: input.service,
        master: input.master || null,
        serviceId: serviceRef?.id || null,
        masterId: masterRef?.id || null,
        datetime,
        status: 'confirmed',
      },
    });
    await scheduleReminders(appointment as unknown as IAppointment);
    console.log(`[aiAgent] создана запись ${appointment.id} для ${client.id}`);

    // YClients sync (если салон подключил) — async, не блокирует ответ клиенту
    this.syncToYClients(appointment.id, salon.id, client, datetime, input, serviceRef, masterRef).catch((e) =>
      console.error('[aiAgent.syncToYClients] error:', e?.message)
    );

    // Возвращаем структурированные данные — AI сам сформулирует подтверждение клиенту
    // (живо и в контексте диалога, а не template-фразой).
    return {
      content: JSON.stringify({
        success: true,
        appointmentId: appointment.id,
        service: input.service,
        datetime: datetime.toLocaleString('ru-RU'),
        master: input.master || null,
      }),
      isError: false,
    };
  }

  // Дублирующая запись в YClients если салон подключил интеграцию.
  // Async, ошибки не блокируют основной поток (запись в нашей БД остаётся).
  private async syncToYClients(
    appointmentId: string,
    salonId: string,
    client: IClient,
    datetime: Date,
    input: { service: string; master?: string },
    serviceRef: any,
    masterRef: any
  ): Promise<void> {
    const { getSalonCreds, createRecord } = await import('../channels/yclients');
    const creds = await getSalonCreds(salonId);
    if (!creds) return; // YClients не подключён — ок, выходим тихо

    const salonFull = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { yclientsServiceMap: true, yclientsStaffMap: true },
    });
    const serviceMap = (salonFull?.yclientsServiceMap as Record<string, number>) || {};
    const staffMap = (salonFull?.yclientsStaffMap as Record<string, number>) || {};

    const yServiceId = serviceRef ? serviceMap[serviceRef.id] : null;
    const yStaffId = masterRef ? staffMap[masterRef.id] : null;
    if (!yServiceId || !yStaffId) {
      console.warn(
        `[yclients-sync] нет маппинга service/staff для appointment=${appointmentId}: ` +
        `service=${serviceRef?.name} (${yServiceId}), master=${masterRef?.name} (${yStaffId})`
      );
      const { alertWarn } = await import('../utils/alerter');
      alertWarn(
        'YClients sync пропущен (нет маппинга)',
        { salonId, service: input.service, master: input.master },
        `yclients-no-map:${salonId}`
      );
      return;
    }

    // Формат YClients datetime: ISO 8601 с таймзоной
    const isoDate = datetime.toISOString().replace('Z', '+00:00');

    try {
      const result = await createRecord(creds, {
        staff_id: yStaffId,
        services: [{ id: yServiceId }],
        client: {
          phone: client.phone || '',
          name: client.name || 'Клиент',
        },
        datetime: isoDate,
        api_id: appointmentId, // для трекинга
      });
      // Сохраняем yclientsRecordId — чтоб webhook от YClients не задвоил эту же запись
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { yclientsRecordId: String(result.id) },
      });
      console.log(`[yclients-sync] создана запись в YClients id=${result.id} (наша=${appointmentId})`);
    } catch (e: any) {
      console.error(`[yclients-sync] ошибка для appointment=${appointmentId}:`, e?.message);
      const { alertError } = await import('../utils/alerter');
      alertError(
        'YClients sync FAIL',
        { salonId, appointmentId, error: e?.message },
        `yclients-fail:${salonId}`
      );
    }
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
      content: JSON.stringify({
        success: true,
        cancelled: true,
        wasService: appointment.service,
        wasDatetime: appointment.datetime.toLocaleString('ru-RU'),
      }),
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
      content: JSON.stringify({
        success: true,
        rescheduled: true,
        service: updated.service,
        was: appointment.datetime.toLocaleString('ru-RU'),
        now: newDt.toLocaleString('ru-RU'),
      }),
      isError: false,
    };
  }

  // Dry-run для test-chat в админке: без тулов, без записи в БД.
  // history — простая лента предыдущих реплик (порядок: старые → новые).
  async processDryRun(
    salonId: string,
    history: Array<{ role: 'user' | 'assistant'; text: string }>,
    newUserText: string
  ): Promise<{ text: string; usage: AggregateUsage }> {
    const usage: AggregateUsage = {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheCreateTokens: 0,
    };
    const salon = await prisma.salon.findUnique({ where: { id: salonId } });
    if (!salon) throw new Error('Салон не найден');
    const crm = await this.loadSalonCrm(salonId);

    const faqAnswer = this.tryFaqMatch(newUserText, crm.faqs);
    if (faqAnswer) return { text: faqAnswer, usage };

    const stableSystem =
      buildSystemPrompt(salon.niche as NicheKey, {
        name: salon.name,
        services: this.formatServices(crm.services),
        schedule: this.formatSchedule(crm.workingHours),
      }) + `\n\n[РЕЖИМ ТЕСТА] Это пробный чат владельца — отвечай как обычно, но запись не оформляется в системе.`;
    const volatileSystem =
      `Текущая дата: ${new Date().toISOString().slice(0, 10)} (UTC).\nИмя клиента: (тестовый чат).`;

    const messages: Anthropic.MessageParam[] = history
      .slice(-HISTORY_LIMIT)
      .map((m) => ({ role: m.role, content: this.truncate(m.text) }));
    messages.push({ role: 'user', content: this.truncate(newUserText) });

    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: [
        { type: 'text', text: stableSystem, cache_control: { type: 'ephemeral' } } as any,
        { type: 'text', text: volatileSystem },
      ],
      messages,
    });
    this.accumulateUsage(usage, response.usage);

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as Anthropic.TextBlock).text)
      .join('\n')
      .trim();
    return { text: text || '(пустой ответ)', usage };
  }

  private async loadSalonCrm(salonId: string): Promise<SalonCrm> {
    const [services, masters, workingHours, faqs] = await Promise.all([
      prisma.service.findMany({ where: { salonId, isActive: true } }),
      prisma.master.findMany({
        where: { salonId, isActive: true },
        include: { services: { select: { serviceId: true } } },
      }),
      prisma.workingHours.findMany({ where: { salonId, masterId: null } }),
      prisma.faq.findMany({ where: { salonId }, orderBy: { order: 'asc' } }),
    ]);
    return { services, masters, workingHours, faqs };
  }

  // Скачиваем картинки и формируем blocks для Anthropic Vision (base64 для совместимости с OpenRouter).
  private async fetchImagesAsBlocks(urls: string[]): Promise<any[]> {
    const blocks: any[] = [];
    for (const url of urls) {
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const buf = Buffer.from(await r.arrayBuffer());
        // Ограничение: пропускаем гигантские картинки (> 5 MB) чтобы не раздувать prompt
        if (buf.length > 5 * 1024 * 1024) {
          console.warn('[aiAgent.vision] картинка > 5MB пропущена');
          continue;
        }
        const contentType = r.headers.get('content-type') || 'image/jpeg';
        const mediaType = contentType.split(';')[0].trim();
        blocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: buf.toString('base64'),
          },
        });
      } catch (e: any) {
        console.warn('[aiAgent.vision] fetch error:', e?.message);
      }
    }
    return blocks;
  }

  // Контекст клиента: история визитов + любимый мастер.
  // Подсовываем в volatileSystem чтобы AI "помнил" клиента и не звучал как впервые.
  private async buildClientContext(
    clientId: string,
    salonId: string,
    clientName: string | null
  ): Promise<string> {
    const yearAgo = new Date(Date.now() - 365 * 24 * 3600 * 1000);
    const appts = await prisma.appointment.findMany({
      where: { clientId, salonId, datetime: { gte: yearAgo } },
      orderBy: { datetime: 'desc' },
      take: 10,
      include: { masterRef: { select: { name: true } } },
    });

    if (appts.length === 0) {
      return `Клиент новый — у нас впервые. Не спрашивай "вы у нас уже были?" просто помогай.`;
    }

    const completed = appts.filter((a) => a.status === 'completed' || a.status === 'confirmed');
    const last = appts[0];
    const lastDate = last.datetime.toLocaleDateString('ru-RU');

    // Любимый мастер: самый частый среди завершённых
    const masterCounts = new Map<string, number>();
    for (const a of completed) {
      const m = a.masterRef?.name || a.master;
      if (m) masterCounts.set(m, (masterCounts.get(m) || 0) + 1);
    }
    const favMaster = Array.from(masterCounts.entries()).sort((a, b) => b[1] - a[1])[0];

    const lines = [`КОНТЕКСТ КЛИЕНТА (используй чтобы звучать как знакомый, но не упоминай в лоб):`];
    lines.push(`— Визитов за год: ${completed.length}.`);
    lines.push(`— Последний визит: ${lastDate}, ${last.service}.`);
    if (favMaster && favMaster[1] >= 2) {
      lines.push(`— Чаще всего ходит к мастеру: ${favMaster[0]} (${favMaster[1]} раз). Можешь предложить его по умолчанию.`);
    }
    if (completed.length >= 3) {
      lines.push(`— Постоянный клиент. Тон чуть теплее, можно приветствовать по имени${clientName ? ` (${clientName})` : ''}.`);
    }
    return lines.join('\n');
  }

  // Простой матч FAQ: ищем пересечение значимых слов вопроса клиента с FAQ-вопросами салона.
  private tryFaqMatch(text: string, faqs: Faq[]): string | null {
    if (!faqs.length) return null;
    if (text.length > 100) return null;

    const normalize = (s: string) =>
      s.toLowerCase().replace(/[^a-zа-яё0-9\s]/gi, ' ').split(/\s+/).filter((w) => w.length > 3);

    const qWords = new Set(normalize(text));
    if (qWords.size < 1) return null;

    let bestScore = 0;
    let bestAnswer: string | null = null;
    for (const item of faqs) {
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

  private formatServices(services: Service[]): string {
    if (!services.length) return '(не указано)';
    return services
      .map((s) => `• ${s.name} — ${s.price}₽${s.durationMin ? ` (${s.durationMin} мин)` : ''}`)
      .join('\n');
  }

  private formatSchedule(hours: WorkingHours[]): string {
    if (!hours.length) return '(не указан)';
    const dayNames = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    const fmt = (min: number) =>
      `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
    // Группируем по диапазону времени
    const groups = new Map<string, number[]>();
    for (const h of hours) {
      const key = `${h.fromMin}-${h.toMin}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(h.weekday);
    }
    return Array.from(groups.entries())
      .map(([range, days]) => {
        const [from, to] = range.split('-').map(Number);
        const sorted = days.sort((a, b) => a - b).map((d) => dayNames[d]).join(', ');
        return `${fmt(from)}–${fmt(to)} (${sorted})`;
      })
      .join('; ');
  }
}

export const aiAgent = new AIAgent();
