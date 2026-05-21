import { Router } from 'express';
import prisma from '../db/prisma';
import redis from '../db/redis';

const router = Router();

// GET /health — статус сервисов
router.get('/', async (_req, res) => {
  const result: any = { status: 'ok', services: {} };

  try {
    await prisma.$queryRaw`SELECT 1`;
    result.services.postgres = 'up';
  } catch (e: any) {
    result.services.postgres = 'down';
    result.status = 'degraded';
  }

  try {
    const pong = await redis.ping();
    result.services.redis = pong === 'PONG' ? 'up' : 'down';
  } catch {
    result.services.redis = 'down';
    result.status = 'degraded';
  }

  res.json(result);
});

export default router;
