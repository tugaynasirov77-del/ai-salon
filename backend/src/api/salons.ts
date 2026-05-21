import { Router } from 'express';
import prisma from '../db/prisma';
import { asyncHandler } from '../middleware/errors';
import { setWebhookForSalon } from '../channels/telegram';

const router = Router();

// POST /api/salons — создать салон
router.post(
  '/',
  asyncHandler(async (req, res) => {
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
    const { status, from, to } = req.query as Record<string, string | undefined>;
    const where: any = { salonId: req.params.id };
    if (status) where.status = status;
    if (from || to) {
      where.datetime = {};
      if (from) where.datetime.gte = new Date(from);
      if (to) where.datetime.lte = new Date(to);
    }
    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { datetime: 'asc' },
      include: { client: true },
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

// GET /api/salons/:id/analytics
router.get(
  '/:id/analytics',
  asyncHandler(async (req, res) => {
    const salonId = req.params.id;
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const [clientsTotal, appointmentsTotal, appointmentsLast30, messagesLast30, byStatus] =
      await Promise.all([
        prisma.client.count({ where: { salonId } }),
        prisma.appointment.count({ where: { salonId } }),
        prisma.appointment.count({ where: { salonId, createdAt: { gte: since } } }),
        prisma.message.count({ where: { salonId, createdAt: { gte: since } } }),
        prisma.appointment.groupBy({
          by: ['status'],
          where: { salonId },
          _count: { _all: true },
        }),
      ]);

    res.json({
      clientsTotal,
      appointmentsTotal,
      appointmentsLast30,
      messagesLast30,
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
    });
  })
);

export default router;
