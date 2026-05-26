// Платформенная админка — только для нас. Защищён X-Admin-Token (env ADMIN_TOKEN).
import { Router } from 'express';
import prisma from '../db/prisma';
import redis from '../db/redis';
import { asyncHandler } from '../middleware/errors';

const router = Router();

// Простая защита через env-токен
function requireAdmin(req: any, res: any, next: any) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    res.status(503).json({ error: 'ADMIN_TOKEN не задан на сервере' });
    return;
  }
  const provided = req.headers['x-admin-token'] || req.query.token;
  if (provided !== token) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  next();
}

router.use(requireAdmin);

router.get(
  '/status',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 3600 * 1000);
    const since7d = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    // ───── Salons / Users ─────
    const [salonsTotal, salonsActive, salonsNew24h, usersTotal, usersActive7d] = await Promise.all([
      prisma.salon.count(),
      prisma.salon.count({ where: { isActive: true } }),
      prisma.salon.count({ where: { createdAt: { gte: since24h } } }),
      prisma.user.count(),
      prisma.user.count({ where: { lastLoginAt: { gte: since7d } } }),
    ]);

    // ───── Подключения каналов ─────
    const [withTelegram, withMax, withAvito, withYClients] = await Promise.all([
      prisma.salon.count({ where: { telegramBotToken: { not: null } } }),
      prisma.salon.count({ where: { maxBotToken: { not: null } } }),
      prisma.salon.count({ where: { avitoClientId: { not: null } } }),
      prisma.salon.count({ where: { yclientsCompanyId: { not: null } } }),
    ]);

    // ───── Clients / Appointments ─────
    const [clientsTotal, clientsNew24h, apptsTotal, apptsLast24h, apptsByStatus] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { createdAt: { gte: since24h } } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { createdAt: { gte: since24h } } }),
      prisma.appointment.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    // ───── Messages ─────
    const [msgs24h, msgsByChannel, msgsByDirection] = await Promise.all([
      prisma.message.count({ where: { createdAt: { gte: since24h } } }),
      prisma.message.groupBy({
        by: ['channel'],
        where: { createdAt: { gte: since24h } },
        _count: { _all: true },
      }),
      prisma.message.groupBy({
        by: ['direction'],
        where: { createdAt: { gte: since24h } },
        _count: { _all: true },
      }),
    ]);

    // ───── LLM usage (только outgoing — где usage заполняется) ─────
    const tokens24h = await prisma.message.aggregate({
      where: { createdAt: { gte: since24h }, direction: 'out' },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cacheReadTokens: true,
        cacheCreateTokens: true,
      },
    });
    const tokensTotal = await prisma.message.aggregate({
      where: { direction: 'out' },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cacheReadTokens: true,
        cacheCreateTokens: true,
      },
    });
    // Цены Haiku 4.5 $/M
    const calcCost = (t: typeof tokens24h._sum) =>
      ((t.inputTokens || 0) * 1 +
        (t.outputTokens || 0) * 5 +
        (t.cacheReadTokens || 0) * 0.1 +
        (t.cacheCreateTokens || 0) * 1.25) /
      1_000_000;
    const cacheHitRate = (t: typeof tokens24h._sum) => {
      const total = (t.inputTokens || 0) + (t.cacheReadTokens || 0) + (t.cacheCreateTokens || 0);
      if (total === 0) return 0;
      return (t.cacheReadTokens || 0) / total;
    };

    // ───── Reminder queue (BullMQ) ─────
    let queueStats: any = { error: 'redis недоступен' };
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        redis.llen('bull:reminders:wait'),
        redis.llen('bull:reminders:active'),
        redis.zcard('bull:reminders:completed'),
        redis.zcard('bull:reminders:failed'),
        redis.zcard('bull:reminders:delayed'),
      ]);
      queueStats = { waiting, active, completed, failed, delayed };
    } catch (e: any) {
      queueStats = { error: e?.message };
    }

    // ───── Health ─────
    const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
    const redisOk = await redis.ping().then(() => true).catch(() => false);

    res.json({
      timestamp: now.toISOString(),
      health: {
        postgres: dbOk ? 'up' : 'down',
        redis: redisOk ? 'up' : 'down',
        env: process.env.NODE_ENV || 'dev',
        baseUrl: process.env.BASE_URL,
      },
      salons: {
        total: salonsTotal,
        active: salonsActive,
        new24h: salonsNew24h,
      },
      users: { total: usersTotal, activeLast7d: usersActive7d },
      channels: {
        telegram: withTelegram,
        max: withMax,
        avito: withAvito,
        yclients: withYClients,
      },
      clients: { total: clientsTotal, new24h: clientsNew24h },
      appointments: {
        total: apptsTotal,
        last24h: apptsLast24h,
        byStatus: apptsByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      },
      messages24h: {
        total: msgs24h,
        byChannel: msgsByChannel.map((r) => ({ channel: r.channel, count: r._count._all })),
        byDirection: msgsByDirection.map((r) => ({ direction: r.direction, count: r._count._all })),
      },
      llm: {
        last24h: {
          tokens: tokens24h._sum,
          estimatedCostUsd: Number(calcCost(tokens24h._sum).toFixed(4)),
          cacheHitRate: Number(cacheHitRate(tokens24h._sum).toFixed(3)),
        },
        total: {
          tokens: tokensTotal._sum,
          estimatedCostUsd: Number(calcCost(tokensTotal._sum).toFixed(4)),
          cacheHitRate: Number(cacheHitRate(tokensTotal._sum).toFixed(3)),
        },
      },
      remindersQueue: queueStats,
    });
  })
);

// Список последних N салонов с краткой инфой
router.get(
  '/salons',
  asyncHandler(async (req, res) => {
    const limit = Math.min(100, Number(req.query.limit) || 30);
    const salons = await prisma.salon.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        niche: true,
        plan: true,
        isActive: true,
        createdAt: true,
        telegramBotToken: true,
        yclientsCompanyId: true,
        _count: { select: { clients: true, appointments: true, messages: true } },
      },
    });
    res.json(
      salons.map((s) => ({
        id: s.id,
        name: s.name,
        niche: s.niche,
        plan: s.plan,
        isActive: s.isActive,
        createdAt: s.createdAt,
        channels: {
          telegram: !!s.telegramBotToken,
          yclients: !!s.yclientsCompanyId,
        },
        counts: s._count,
      }))
    );
  })
);

export default router;
