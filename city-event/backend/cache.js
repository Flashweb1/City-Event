import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300', 10); // 5 min default

let redis = null;
let enabled = false;

if (REDIS_URL) {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 3000),
    lazyConnect: true
  });

  redis.on('error', (err) => {
    console.warn('Redis connection error (caching disabled):', err.message);
    enabled = false;
  });

  redis.on('connect', () => {
    enabled = true;
  });

  redis.connect().catch(() => { enabled = false; });
}

export function getCacheKey(req) {
  const base = `${req.method}:${req.originalUrl || req.url}`;
  const userId = req.user?.id || 'anon';
  return `cache:${base}:${userId}`;
}

export function cacheMiddleware(duration = CACHE_TTL) {
  return async (req, res, next) => {
    if (!enabled || !redis || req.method !== 'GET') return next();

    const key = getCacheKey(req);
    try {
      const cached = await redis.get(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        return res.json(parsed);
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        redis.set(key, JSON.stringify(body), 'EX', duration).catch(() => {});
        originalJson(body);
      };
      next();
    } catch {
      next();
    }
  };
}

export function invalidateCache(pattern) {
  if (!enabled || !redis) return;
  const keys = redis.keys(`cache:${pattern}:*`);
  keys.then(k => { if (k.length) redis.del(k); }).catch(() => {});
}

export async function getRedisClient() {
  if (enabled && redis) return redis;
  return null;
}

export { redis, enabled }; // for testing