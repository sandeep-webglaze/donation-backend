import { registerAs } from '@nestjs/config';

/**
 * 🔥 REDIS CONFIGURATION
 * Central configuration for Redis connection and behavior
 */
export default registerAs('redis', () => ({
  // Connection settings
  host: process.env.REDIS_HOST ?? 'localhost',

  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),

  password: process.env.REDIS_PASSWORD ?? undefined,

  db: parseInt(process.env.REDIS_DB ?? '0', 10),

  // Key prefix for all Redis keys
  keyPrefix: process.env.REDIS_KEY_PREFIX ?? 'myapp:',

  // Default TTL (seconds)
  ttl: parseInt(process.env.REDIS_TTL ?? '300', 10),

  // Connection behavior
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,

  // Connection pool settings
  lazyConnect: false,
  keepAlive: 30000,

  // Retry strategy
  retryStrategy: (times: number) => {
    return Math.min(times * 50, 2000);
  },
}));
