import Redis from 'ioredis';

const url = process.env.REDIS_URL || 'redis://localhost:6379';

// Singleton Redis для кэша и rate limiting
export const redis = new Redis(url, {
  maxRetriesPerRequest: null, // требуется для BullMQ
});

redis.on('error', (err) => {
  console.error('[redis] error:', err.message);
});

export default redis;
