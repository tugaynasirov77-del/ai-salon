import { Router } from 'express';
import prisma from '../db/prisma';
import { asyncHandler } from '../middleware/errors';
import { setWebhookForSalon } from '../channels/telegram';
import {
  setWebhookForSalon as setMaxWebhook,
  getBotInfo as getMaxBotInfo,
} from '../channels/max';
import {
  getSelfInfo as getAvitoSelfInfo,
  subscribeWebhook as subscribeAvitoWebhook,
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
    if (!companyId) {
      try {
        const companies = await yclientsGetCompanies({ companyId: '0', userToken: auth.user_token });
        res.json({
          step: 'select_company',
          userToken: auth.user_token,
          companies: companies.map((c) => ({ id: c.id, title: c.title })),
        });
        return;
      } catch (e: any) {
        res.status(400).json({ error: `Не удалось получить список филиалов: ${e?.message}` });
        return;
      }
    }

    // Шаг 2: финальное подключение
    const salon = await prisma.salon.update({
      where: { id: req.params.id },
      data: {
        yclientsCompanyId: String(companyId),
        yclientsUserToken: auth.user_token,
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
      mapping,
      note: `Сопоставили ${mapping.servicesMatched} услуг и ${mapping.staffMatched} мастеров. ` +
            `Если что-то не сопоставилось — поправь названия в одной из систем чтобы совпадали.`,
    });
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

// GET /api/salons/:id/conversations — список клиентов с последним сообщением
router.get(
  '/:id/conversations',
  asyncHandler(async (req, res) => {
    const salonId = req.params.id;
    // Берём последние 1000 сообщений и сворачиваем по clientId
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
        createdAt: true,
      },
    });
    const byClient = new Map<string, { last: typeof recent[number]; count: number }>();
    for (const m of recent) {
      const entry = byClient.get(m.clientId);
      if (!entry) byClient.set(m.clientId, { last: m, count: 1 });
      else entry.count++;
    }
    const clientIds = Array.from(byClient.keys());
    if (clientIds.length === 0) {
      res.json([]);
      return;
    }
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
    });
    const result = clients
      .map((c) => {
        const entry = byClient.get(c.id)!;
        return {
          client: c,
          lastMessage: entry.last,
          messagesCount: entry.count,
        };
      })
      .sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
    res.json(result);
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
    });
  })
);

export default router;
