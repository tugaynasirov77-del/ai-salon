import { Router } from 'express';
import prisma from '../db/prisma';
import { asyncHandler } from '../middleware/errors';
import { setWebhookForSalon, removeWebhook as removeTelegramWebhook } from '../channels/telegram';
import {
  setWebhookForSalon as setMaxWebhook,
  getBotInfo as getMaxBotInfo,
  removeWebhook as removeMaxWebhook,
} from '../channels/max';
import {
  getSelfInfo as getAvitoSelfInfo,
  subscribeWebhook as subscribeAvitoWebhook,
  unsubscribeWebhook as unsubscribeAvitoWebhook,
} from '../channels/avito';
import {
  authUser as yclientsAuthUser,
  getUserCompanies as yclientsGetCompanies,
  autoMapSalon as yclientsAutoMap,
} from '../channels/yclients';

const router = Router();

// POST /api/salons — создать салон (только для платформенных админов, ключ в env ADMIN_TOKEN)
// Для обычной регистрации владельцами используется /api/auth/register.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const adminToken = process.env.ADMIN_TOKEN;
    const provided = req.headers['x-admin-token'];
    if (!adminToken || provided !== adminToken) {
      res.status(403).json({ error: 'Требуется x-admin-token. Для регистрации используйте /api/auth/register' });
      return;
    }
    const { name, ownerName, phone, address, niche, plan, telegramBotToken, settings } = req.body;
    if (!name || !ownerName || !phone || !niche) {
      res.status(400).json({ error: 'name, ownerName, phone, niche обязательны' });
      return;
    }
    const salon = await prisma.salon.create({
      data: { name, ownerName, phone, address, niche, plan, telegramBotToken, settings },
    });
    res.status(201).json(salon);
  })
);

// GET /api/salons/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const salon = await prisma.salon.findUnique({ where: { id: req.params.id } });
    if (!salon) {
      res.status(404).json({ error: 'Салон не найден' });
      return;
    }
    res.json(salon);
  })
);

// PUT /api/salons/:id — обновить настройки
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    delete data.id;
    delete data.createdAt;
    const salon = await prisma.salon.update({ where: { id }, data });
    res.json(salon);
  })
);

// POST /api/salons/:id/telegram/connect — подключить Telegram-бот к салону
router.post(
  '/:id/telegram/connect',
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'token обязателен (строка)' });
      return;
    }
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      res.status(500).json({ error: 'BASE_URL не задан на сервере' });
      return;
    }

    const salon = await prisma.salon.update({
      where: { id: req.params.id },
      data: { telegramBotToken: token },
    });

    try {
      await setWebhookForSalon(salon.id, token, baseUrl);
    } catch (e: any) {
      res.status(400).json({ error: `Не удалось установить webhook: ${e?.message}` });
      return;
    }

    res.json({ ok: true, salonId: salon.id, webhookUrl: `${baseUrl}/webhook/telegram/${salon.id}` });
  })
);

// POST /api/salons/:id/yclients/connect — подключение YClients
// Шаг 1: только login+password → возвращаем список филиалов владельца, чтобы он выбрал нужный.
// Шаг 2: login+password+companyId → сохраняем, авто-маппим услуги и мастеров.
router.post(
  '/:id/yclients/connect',
  asyncHandler(async (req, res) => {
    const { login, password, companyId } = req.body;
    if (!login || !password) {
      res.status(400).json({ error: 'login, password обязательны' });
      return;
    }

    let auth;
    try {
      auth = await yclientsAuthUser(String(login), String(password));
    } catch (e: any) {
      res.status(400).json({ error: `Не удалось авторизоваться в YClients: ${e?.message}` });
      return;
    }

    // Шаг 1: companyId не передан — отдаём список филиалов
    let companiesList: Array<{ id: number; title: string }> = [];
    try {
      companiesList = await yclientsGetCompanies({ companyId: '0', userToken: auth.user_token });
    } catch (e: any) {
      res.status(400).json({ error: `Не удалось получить список филиалов: ${e?.message}` });
      return;
    }
    if (!companyId) {
      res.json({
        step: 'select_company',
        userToken: auth.user_token,
        companies: companiesList.map((c) => ({ id: c.id, title: c.title })),
      });
      return;
    }

    // Шаг 2: финальное подключение
    const chosen = companiesList.find((c) => String(c.id) === String(companyId));
    const salon = await prisma.salon.update({
      where: { id: req.params.id },
      data: {
        yclientsCompanyId: String(companyId),
        yclientsCompanyTitle: chosen?.title || null,
        yclientsUserToken: auth.user_token,
        yclientsLastSyncAt: new Date(),
      },
    });

    // Автомаппинг услуг и мастеров
    let mapping = { servicesMatched: 0, staffMatched: 0 };
    try {
      mapping = await yclientsAutoMap(salon.id, {
        companyId: String(companyId),
        userToken: auth.user_token,
      });
    } catch (e: any) {
      console.warn('[yclients.connect] автомаппинг провалился:', e?.message);
    }

    res.json({
      ok: true,
      salonId: salon.id,
      companyId,
      companyTitle: chosen?.title || null,
      mapping,
      note: `Сопоставили ${mapping.servicesMatched} услуг и ${mapping.staffMatched} мастеров. ` +
            `Если что-то не сопоставилось — поправь названия в одной из систем чтобы совпадали.`,
    });
  })
);

// ───── DISCONNECT-эндпоинты ─────
// POST /api/salons/:id/telegram/disconnect — снимает webhook у TG + чистит токен
router.post(
  '/:id/telegram/disconnect',
  asyncHandler(async (req, res) => {
    const salon = await prisma.salon.findUnique({ where: { id: req.params.id } });
    if (salon?.telegramBotToken) {
      await removeTelegramWebhook(salon.telegramBotToken);
    }
    await prisma.salon.update({
      where: { id: req.params.id },
      data: { telegramBotToken: null },
    });
    res.json({ ok: true });
  })
);

// POST /api/salons/:id/max/disconnect
router.post(
  '/:id/max/disconnect',
  asyncHandler(async (req, res) => {
    const baseUrl = process.env.BASE_URL!;
    const salon = await prisma.salon.findUnique({ where: { id: req.params.id } });
    if (salon?.maxBotToken) {
      await removeMaxWebhook(salon.maxBotToken, `${baseUrl}/webhook/max/${salon.id}`);
    }
    await prisma.salon.update({
      where: { id: req.params.id },
      data: { maxBotToken: null },
    });
    res.json({ ok: true });
  })
);

// POST /api/salons/:id/avito/disconnect
router.post(
  '/:id/avito/disconnect',
  asyncHandler(async (req, res) => {
    const baseUrl = process.env.BASE_URL!;
    const salon = await prisma.salon.findUnique({ where: { id: req.params.id } });
    if (salon?.avitoClientId && salon.avitoClientSecret && salon.avitoUserId) {
      await unsubscribeAvitoWebhook(
        {
          clientId: salon.avitoClientId,
          clientSecret: salon.avitoClientSecret,
          userId: salon.avitoUserId,
        },
        `${baseUrl}/webhook/avito/${salon.id}`
      );
    }
    await prisma.salon.update({
      where: { id: req.params.id },
      data: { avitoClientId: null, avitoClientSecret: null, avitoUserId: null },
    });
    res.json({ ok: true });
  })
);

// POST /api/salons/:id/yclients/disconnect
router.post(
  '/:id/yclients/disconnect',
  asyncHandler(async (req, res) => {
    await prisma.salon.update({
      where: { id: req.params.id },
      data: {
        yclientsCompanyId: null,
        yclientsCompanyTitle: null,
        yclientsUserToken: null,
        yclientsServiceMap: undefined,
        yclientsStaffMap: undefined,
        yclientsLastSyncAt: null,
      },
    });
    res.json({ ok: true });
  })
);

// POST /api/salons/:id/avito/connect — подключить Авито (OAuth client_credentials)
router.post(
  '/:id/avito/connect',
  asyncHandler(async (req, res) => {
    const { clientId, clientSecret, userId } = req.body;
    if (!clientId || !clientSecret || !userId) {
      res.status(400).json({ error: 'clientId, clientSecret, userId обязательны' });
      return;
    }
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      res.status(500).json({ error: 'BASE_URL не задан на сервере' });
      return;
    }

    const creds = { clientId, clientSecret, userId: String(userId) };
    let info;
    try {
      info = await getAvitoSelfInfo(creds);
    } catch (e: any) {
      res.status(400).json({ error: `Некорректные авито-креды: ${e?.message}` });
      return;
    }

    const salon = await prisma.salon.update({
      where: { id: req.params.id },
      data: {
        avitoClientId: clientId,
        avitoClientSecret: clientSecret,
        avitoUserId: String(userId),
      },
    });

    const callbackUrl = `${baseUrl}/webhook/avito/${salon.id}`;
    try {
      await subscribeAvitoWebhook(creds, callbackUrl);
    } catch (e: any) {
      res.status(400).json({ error: `Не удалось подписать webhook: ${e?.message}` });
      return;
    }

    res.json({ ok: true, salonId: salon.id, account: info, webhookUrl: callbackUrl });
  })
);

// POST /api/salons/:id/max/connect — подключить Max-бот
router.post(
  '/:id/max/connect',
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'token обязателен (строка)' });
      return;
    }
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      res.status(500).json({ error: 'BASE_URL не задан на сервере' });
      return;
    }

    // Валидация токена через /me
    let botInfo;
    try {
      botInfo = await getMaxBotInfo(token);
    } catch (e: any) {
      res.status(400).json({ error: `Некорректный max-токен: ${e?.message}` });
      return;
    }

    const salon = await prisma.salon.update({
      where: { id: req.params.id },
      data: { maxBotToken: token },
    });

    try {
      await setMaxWebhook(salon.id, token, baseUrl);
    } catch (e: any) {
      res.status(400).json({ error: `Не удалось подписать webhook: ${e?.message}` });
      return;
    }

    res.json({
      ok: true,
      salonId: salon.id,
      bot: botInfo,
      webhookUrl: `${baseUrl}/webhook/max/${salon.id}`,
    });
  })
);

// GET /api/salons/:id/clients
router.get(
  '/:id/clients',
  asyncHandler(async (req, res) => {
    const clients = await prisma.client.findMany({
      where: { salonId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json(clients);
  })
);

// GET /api/salons/:id/appointments
router.get(
  '/:id/appointments',
  asyncHandler(async (req, res) => {
    const { status, from, to, masterId, serviceId, clientId } = req.query as Record<string, string | undefined>;
    const where: any = { salonId: req.params.id };
    if (status) where.status = status;
    if (masterId) where.masterId = masterId;
    if (serviceId) where.serviceId = serviceId;
    if (clientId) where.clientId = clientId;
    if (from || to) {
      where.datetime = {};
      if (from) where.datetime.gte = new Date(from);
      if (to) where.datetime.lte = new Date(to);
    }
    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { datetime: 'asc' },
      include: { client: true, serviceRef: true, masterRef: true },
      take: 500,
    });
    res.json(appointments);
  })
);

// GET /api/salons/:id/messages
router.get(
  '/:id/messages',
  asyncHandler(async (req, res) => {
    const { clientId } = req.query as Record<string, string | undefined>;
    const where: any = { salonId: req.params.id };
    if (clientId) where.clientId = clientId;
    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json(messages);
  })
);

// GET /api/salons/:id/conversations — список клиентов с последним сообщением + unread
router.get(
  '/:id/conversations',
  asyncHandler(async (req, res) => {
    const salonId = req.params.id;
    const recent = await prisma.message.findMany({
      where: { salonId },
      orderBy: { createdAt: 'desc' },
      take: 1000,
      select: {
        id: true,
        clientId: true,
        text: true,
        direction: true,
        channel: true,
        readByOwner: true,
        createdAt: true,
      },
    });
    const byClient = new Map<string, { last: typeof recent[number]; count: number; unread: number }>();
    for (const m of recent) {
      const entry = byClient.get(m.clientId);
      const isUnread = m.direction === 'in' && !m.readByOwner;
      if (!entry) byClient.set(m.clientId, { last: m, count: 1, unread: isUnread ? 1 : 0 });
      else {
        entry.count++;
        if (isUnread) entry.unread++;
      }
    }
    const clientIds = Array.from(byClient.keys());
    if (clientIds.length === 0) {
      res.json([]);
      return;
    }
    const clients = await prisma.client.findMany({ where: { id: { in: clientIds } } });
    const result = clients
      .map((c) => {
        const entry = byClient.get(c.id)!;
        return {
          client: c,
          lastMessage: entry.last,
          messagesCount: entry.count,
          unreadCount: entry.unread,
        };
      })
      .sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
    res.json(result);
  })
);

// POST /api/salons/:id/conversations/:clientId/read — пометить все входящие как прочитанные
router.post(
  '/:id/conversations/:clientId/read',
  asyncHandler(async (req, res) => {
    const { id: salonId, clientId } = req.params;
    const r = await prisma.message.updateMany({
      where: { salonId, clientId, direction: 'in', readByOwner: false },
      data: { readByOwner: true },
    });
    res.json({ ok: true, marked: r.count });
  })
);

// POST /api/salons/:id/conversations/:clientId/message — ручной ответ владельца клиенту
// Отправляет через тот же канал что preferredChannel клиента (или conversation), пишет в БД,
// автоматически помечает sentByOwner=true и readByOwner=true.
router.post(
  '/:id/conversations/:clientId/message',
  asyncHandler(async (req, res) => {
    const { id: salonId, clientId } = req.params;
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'text обязателен' });
      return;
    }
    const [salon, client] = await Promise.all([
      prisma.salon.findUnique({ where: { id: salonId } }),
      prisma.client.findFirst({ where: { id: clientId, salonId } }),
    ]);
    if (!salon || !client) {
      res.status(404).json({ error: 'Салон или клиент не найден' });
      return;
    }

    // Отправляем через каскад каналов
    const { cascadeSender } = await import('../channels/cascadeSender');
    const result = await cascadeSender.send(
      client as any,
      text,
      salon as any
    );

    // Сохраняем как исходящее (без LLM usage)
    const message = await prisma.message.create({
      data: {
        salonId,
        clientId,
        channel: result.channel || client.preferredChannel,
        direction: 'out',
        text,
        sentByOwner: true,
        readByOwner: true,
      },
    });

    // Заодно помечаем все входящие этого клиента как прочитанные — владелец явно вмешался
    await prisma.message.updateMany({
      where: { salonId, clientId, direction: 'in', readByOwner: false },
      data: { readByOwner: true },
    });

    res.json({
      ok: result.success,
      message,
      delivery: { channel: result.channel, attempted: result.attemptedChannels, error: result.error },
    });
  })
);

// GET /api/salons/:id/conversations/:clientId — полная история клиента
router.get(
  '/:id/conversations/:clientId',
  asyncHandler(async (req, res) => {
    const { id: salonId, clientId } = req.params;
    const [client, messages, appointments] = await Promise.all([
      prisma.client.findFirst({ where: { id: clientId, salonId } }),
      prisma.message.findMany({
        where: { salonId, clientId },
        orderBy: { createdAt: 'asc' },
        take: 500,
      }),
      prisma.appointment.findMany({
        where: { salonId, clientId },
        orderBy: { datetime: 'desc' },
      }),
    ]);
    if (!client) {
      res.status(404).json({ error: 'Клиент не найден' });
      return;
    }
    res.json({ client, messages, appointments });
  })
);

// GET /api/salons/:id/usage — расход токенов Claude (для биллинга)
router.get(
  '/:id/usage',
  asyncHandler(async (req, res) => {
    const salonId = req.params.id;
    const { from, to } = req.query as Record<string, string | undefined>;
    const where: any = { salonId, direction: 'out' };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    const agg = await prisma.message.aggregate({
      where,
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cacheReadTokens: true,
        cacheCreateTokens: true,
      },
      _count: { _all: true },
    });
    const sum = agg._sum;
    // Цены Haiku 4.5 (на момент написания): in $1/M, out $5/M, cache_read $0.1/M, cache_create $1.25/M
    const cost =
      ((sum.inputTokens || 0) * 1 +
        (sum.outputTokens || 0) * 5 +
        (sum.cacheReadTokens || 0) * 0.1 +
        (sum.cacheCreateTokens || 0) * 1.25) /
      1_000_000;
    const cacheHitRate =
      (sum.cacheReadTokens || 0) /
      Math.max(1, (sum.inputTokens || 0) + (sum.cacheReadTokens || 0) + (sum.cacheCreateTokens || 0));
    res.json({
      messages: agg._count._all,
      tokens: {
        input: sum.inputTokens || 0,
        output: sum.outputTokens || 0,
        cacheRead: sum.cacheReadTokens || 0,
        cacheCreate: sum.cacheCreateTokens || 0,
      },
      estimatedCostUsd: Number(cost.toFixed(4)),
      cacheHitRate: Number(cacheHitRate.toFixed(3)),
    });
  })
);

// GET /api/salons/:id/analytics?from=&to=
router.get(
  '/:id/analytics',
  asyncHandler(async (req, res) => {
    const salonId = req.params.id;
    const { from, to } = req.query as Record<string, string | undefined>;
    const fromDt = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const toDt = to ? new Date(to) : new Date();
    const periodRange = { gte: fromDt, lte: toDt };

    const [
      clientsTotal,
      newClientsInPeriod,
      appointmentsTotal,
      appointmentsInPeriod,
      messagesInPeriod,
      byStatus,
      completed,
      uniqueClientsMessaged,
      uniqueClientsBooked,
    ] = await Promise.all([
      prisma.client.count({ where: { salonId } }),
      prisma.client.count({ where: { salonId, createdAt: periodRange } }),
      prisma.appointment.count({ where: { salonId } }),
      prisma.appointment.count({ where: { salonId, createdAt: periodRange } }),
      prisma.message.count({ where: { salonId, createdAt: periodRange } }),
      prisma.appointment.groupBy({
        by: ['status'],
        where: { salonId, createdAt: periodRange },
        _count: { _all: true },
      }),
      prisma.appointment.findMany({
        where: { salonId, status: 'completed', datetime: periodRange },
        include: { serviceRef: { select: { price: true } } },
      }),
      prisma.message.findMany({
        where: { salonId, createdAt: periodRange },
        select: { clientId: true },
        distinct: ['clientId'],
      }),
      prisma.appointment.findMany({
        where: { salonId, createdAt: periodRange },
        select: { clientId: true },
        distinct: ['clientId'],
      }),
    ]);

    const revenue = completed.reduce((sum, a) => sum + (a.serviceRef?.price ?? 0), 0);
    const conversion =
      uniqueClientsMessaged.length === 0
        ? 0
        : uniqueClientsBooked.length / uniqueClientsMessaged.length;

    // По дням: создание записей
    const byDay = await prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day, COUNT(*)::bigint AS count
      FROM "Appointment"
      WHERE "salonId" = ${salonId}
        AND "createdAt" >= ${fromDt}
        AND "createdAt" <= ${toDt}
      GROUP BY day
      ORDER BY day ASC
    `;

    // Топ услуг — по числу записей + выручка по completed
    const topServicesAgg = await prisma.appointment.groupBy({
      by: ['service'],
      where: { salonId, createdAt: periodRange },
      _count: { _all: true },
      orderBy: { _count: { service: 'desc' } },
      take: 5,
    });
    const topServiceNames = topServicesAgg.map((r) => r.service);
    const revenueByService: Record<string, number> = {};
    for (const a of completed) {
      if (topServiceNames.includes(a.service)) {
        revenueByService[a.service] = (revenueByService[a.service] || 0) + (a.serviceRef?.price ?? 0);
      }
    }
    const topServices = topServicesAgg.map((r) => ({
      name: r.service,
      count: r._count._all,
      revenue: revenueByService[r.service] || 0,
    }));

    // Каналы привлечения — первое сообщение каждого клиента
    const channelSourcesRaw = await prisma.$queryRaw<Array<{ channel: string; count: bigint }>>`
      SELECT channel, COUNT(*)::bigint AS count FROM (
        SELECT DISTINCT ON ("clientId") channel
        FROM "Message"
        WHERE "salonId" = ${salonId}
          AND "createdAt" >= ${fromDt}
          AND "createdAt" <= ${toDt}
          AND "direction" = 'in'
        ORDER BY "clientId", "createdAt" ASC
      ) AS first_msgs
      GROUP BY channel
      ORDER BY count DESC
    `;
    const channelSources = channelSourcesRaw.map((r) => ({ channel: r.channel, count: Number(r.count) }));

    res.json({
      period: { from: fromDt.toISOString(), to: toDt.toISOString() },
      clientsTotal,
      newClientsInPeriod,
      appointmentsTotal,
      appointmentsInPeriod,
      messagesInPeriod,
      revenue,
      conversion: Number(conversion.toFixed(3)),
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
      byDay: byDay.map((r) => ({ day: r.day, count: Number(r.count) })),
      topServices,
      channelSources,
    });
  })
);

export default router;
