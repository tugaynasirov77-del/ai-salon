// HTTP-метрики: latency, error rate, top ошибок.
// Пишем в Redis sorted set, читаем агрегаты в /api/admin/metrics.
import type { Request, Response, NextFunction } from 'express';
import redis from '../db/redis';

const KEY = 'metrics:reqs';
const TTL_MS = 60 * 60 * 1000; // храним 1 час

// Нормализуем путь чтобы не плодить уникальные сегменты с id
// /api/salons/abc123/conversations → /api/salons/:id/conversations
function normalizePath(path: string): string {
  return path
    .split('?')[0]
    .split('/')
    .map((seg) => {
      // Cuid (c + 24 hex) или uuid или просто длинный id
      if (/^c[a-z0-9]{20,30}$/i.test(seg)) return ':id';
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg)) return ':uuid';
      if (/^\d+$/.test(seg) && seg.length > 2) return ':n';
      return seg;
    })
    .join('/');
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const latency = Date.now() - start;
    const path = normalizePath(req.originalUrl || req.url || '');
    const member = `${start}|${latency}|${res.statusCode}|${req.method}|${path}`;
    // score = timestamp, для удобного ZRANGEBYSCORE и очистки
    redis.zadd(KEY, start, member).catch(() => {});
  });
  next();
}

// Периодическая очистка старых записей (раз в 5 минут)
let cleanupStarted = false;
export function startMetricsCleanup(): void {
  if (cleanupStarted) return;
  cleanupStarted = true;
  setInterval(() => {
    const cutoff = Date.now() - TTL_MS;
    redis.zremrangebyscore(KEY, 0, cutoff).catch(() => {});
  }, 5 * 60 * 1000).unref();
}

type Sample = {
  ts: number;
  latency: number;
  status: number;
  method: string;
  path: string;
};

function parseSample(member: string): Sample | null {
  const parts = member.split('|');
  if (parts.length < 5) return null;
  return {
    ts: Number(parts[0]),
    latency: Number(parts[1]),
    status: Number(parts[2]),
    method: parts[3],
    path: parts.slice(4).join('|'),
  };
}

function percentile(sortedAsc: number[], p: number): number {
  if (!sortedAsc.length) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.floor((p / 100) * sortedAsc.length));
  return sortedAsc[idx];
}

export async function getMetrics(windowMs: number = 60 * 60 * 1000): Promise<{
  windowMs: number;
  requests: number;
  latency: { p50: number; p95: number; p99: number; max: number; avg: number };
  errorRate: number;
  errors: { total: number; by5xx: number; by4xx: number };
  topErrors: Array<{ status: number; method: string; path: string; count: number }>;
  slowest: Array<{ latency: number; status: number; method: string; path: string; ts: number }>;
}> {
  const now = Date.now();
  const since = now - windowMs;
  const raw = await redis.zrangebyscore(KEY, since, now);
  const samples: Sample[] = raw.map(parseSample).filter((x): x is Sample => x !== null);

  const latencies = samples.map((s) => s.latency).sort((a, b) => a - b);
  const errors = samples.filter((s) => s.status >= 400);
  const by5xx = errors.filter((s) => s.status >= 500).length;
  const by4xx = errors.length - by5xx;

  // Top ошибок: группируем по status+method+path
  const errKey = (s: Sample) => `${s.status}|${s.method}|${s.path}`;
  const errCounts = new Map<string, { sample: Sample; count: number }>();
  for (const s of errors) {
    const k = errKey(s);
    const existing = errCounts.get(k);
    if (existing) existing.count++;
    else errCounts.set(k, { sample: s, count: 1 });
  }
  const topErrors = Array.from(errCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ sample, count }) => ({
      status: sample.status,
      method: sample.method,
      path: sample.path,
      count,
    }));

  // Топ-5 самых медленных
  const slowest = [...samples]
    .sort((a, b) => b.latency - a.latency)
    .slice(0, 5)
    .map((s) => ({ latency: s.latency, status: s.status, method: s.method, path: s.path, ts: s.ts }));

  const avg = latencies.length
    ? latencies.reduce((a, b) => a + b, 0) / latencies.length
    : 0;

  return {
    windowMs,
    requests: samples.length,
    latency: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99),
      max: latencies[latencies.length - 1] || 0,
      avg: Math.round(avg),
    },
    errorRate: samples.length ? errors.length / samples.length : 0,
    errors: { total: errors.length, by5xx, by4xx },
    topErrors,
    slowest,
  };
}
