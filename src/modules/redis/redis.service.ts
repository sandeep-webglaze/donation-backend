import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * 🔥 REDIS SERVICE
 * Core Redis client wrapper with connection management
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;
  private isShuttingDown = false;

  /**
   * ⚪ Redis is OPTIONAL. It is only enabled when REDIS_ENABLED=true.
   * When disabled, every operation becomes a safe no-op so the whole app
   * runs perfectly without a Redis server (no connection attempts, no errors).
   */
  private readonly enabled = process.env.REDIS_ENABLED === 'true';

  constructor(private configService: ConfigService) {
    if (this.enabled) {
      this.initializeClients();
    } else {
      this.logger.log(
        '⚪ Redis DISABLED (set REDIS_ENABLED=true to enable). Caching is a no-op.',
      );
    }
  }

  /** Redis is unavailable when disabled OR during shutdown. */
  private get unavailable(): boolean {
    return !this.enabled || this.isShuttingDown;
  }

  /**
   * Initialize Redis clients
   */
  private initializeClients() {
    const redisConfig = this.configService.get('redis');

    const baseOptions = {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      keyPrefix: redisConfig.keyPrefix,
      maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
      enableReadyCheck: redisConfig.enableReadyCheck,
      enableOfflineQueue: redisConfig.enableOfflineQueue,
      lazyConnect: redisConfig.lazyConnect,
      keepAlive: redisConfig.keepAlive,
      retryStrategy: redisConfig.retryStrategy,
    };

    // Main client
    this.client = new Redis(baseOptions);

    // Subscriber and publisher clients (for pub/sub)
    this.subscriber = this.client.duplicate();
    this.publisher = this.client.duplicate();

    // ✅ Event handlers with shutdown awareness
    this.setupEventHandlers(this.client, 'Main');
    this.setupEventHandlers(this.subscriber, 'Subscriber');
    this.setupEventHandlers(this.publisher, 'Publisher');
  }

  /**
   * Setup event handlers for a Redis client
   */
  private setupEventHandlers(client: Redis, name: string) {
    client.on('connect', () => {
      if (!this.isShuttingDown) {
        this.logger.log(`✅ ${name} Redis client connected`);
      }
    });

    client.on('ready', () => {
      if (!this.isShuttingDown) {
        this.logger.log(`✅ ${name} Redis client ready`);
      }
    });

    client.on('error', (err) => {
      // ✅ Only log errors if not shutting down
      if (!this.isShuttingDown) {
        this.logger.error(`❌ ${name} Redis client error:`, err.message);
      }
    });

    client.on('close', () => {
      // ✅ Silent during shutdown
      if (!this.isShuttingDown) {
        this.logger.warn(`⚠️  ${name} Redis client closed unexpectedly`);
      }
    });

    client.on('reconnecting', () => {
      if (!this.isShuttingDown) {
        this.logger.log(`🔄 ${name} Redis client reconnecting...`);
      }
    });

    client.on('end', () => {
      // ✅ Silent during shutdown
      if (!this.isShuttingDown) {
        this.logger.warn(`⚠️  ${name} Redis client connection ended`);
      }
    });
  }

  /**
   * Check if Redis is healthy and available
   */
  isHealthy(): boolean {
    return !this.isShuttingDown && this.client?.status === 'ready';
  }

  /**
   * Get main Redis client
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Get subscriber client
   */
  getSubscriber(): Redis {
    return this.subscriber;
  }

  /**
   * Get publisher client
   */
  getPublisher(): Redis {
    return this.publisher;
  }

  // ========================================
  // BASIC OPERATIONS
  // ========================================

  async get(key: string): Promise<string | null> {
    if (this.unavailable) return null;
    try {
      return await this.client.get(key);
    } catch (error) {
      if (!this.isShuttingDown) {
        this.logger.error(`Redis GET error for key ${key}:`, error.message);
      }
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK' | null> {
    if (this.unavailable) return null;
    try {
      if (ttl) {
        return await this.client.setex(key, ttl, value);
      }
      return await this.client.set(key, value);
    } catch (error) {
      if (!this.isShuttingDown) {
        this.logger.error(`Redis SET error for key ${key}:`, error.message);
      }
      return null;
    }
  }

  async del(key: string): Promise<number> {
    if (this.unavailable) return 0;
    try {
      return await this.client.del(key);
    } catch (error) {
      if (!this.isShuttingDown) {
        this.logger.error(`Redis DEL error for key ${key}:`, error.message);
      }
      return 0;
    }
  }

  async exists(key: string): Promise<number> {
    if (this.unavailable) return 0;
    try {
      return await this.client.exists(key);
    } catch (error) {
      if (!this.isShuttingDown) {
        this.logger.error(`Redis EXISTS error for key ${key}:`, error.message);
      }
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.unavailable) return 0;
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      if (!this.isShuttingDown) {
        this.logger.error(`Redis EXPIRE error for key ${key}:`, error.message);
      }
      return 0;
    }
  }

  async ttl(key: string): Promise<number> {
    if (this.unavailable) return -1;
    try {
      return await this.client.ttl(key);
    } catch (error) {
      if (!this.isShuttingDown) {
        this.logger.error(`Redis TTL error for key ${key}:`, error.message);
      }
      return -1;
    }
  }

  // ========================================
  // HASH OPERATIONS
  // ========================================

  async hget(key: string, field: string): Promise<string | null> {
    if (this.unavailable) return null;
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      if (!this.isShuttingDown) {
        this.logger.error(`Redis HGET error:`, error.message);
      }
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    if (this.unavailable) return 0;
    try {
      return await this.client.hset(key, field, value);
    } catch (error) {
      if (!this.isShuttingDown) {
        this.logger.error(`Redis HSET error:`, error.message);
      }
      return 0;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (this.unavailable) return {};
    try {
      return await this.client.hgetall(key);
    } catch (error) {
      if (!this.isShuttingDown) {
        this.logger.error(`Redis HGETALL error:`, error.message);
      }
      return {};
    }
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    if (this.unavailable) return 0;
    try {
      return await this.client.hdel(key, ...fields);
    } catch (error) {
      if (!this.isShuttingDown) {
        this.logger.error(`Redis HDEL error:`, error.message);
      }
      return 0;
    }
  }

  // ========================================
  // PATTERN OPERATIONS
  // ========================================

  async keys(pattern: string): Promise<string[]> {
    if (this.unavailable) return [];
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      if (!this.isShuttingDown) {
        this.logger.error(`Redis KEYS error:`, error.message);
      }
      return [];
    }
  }

  async scan(
    cursor: string,
    pattern: string,
    count: number = 100,
  ): Promise<[string, string[]]> {
    if (this.unavailable) return ['0', []];
    try {
      return await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', count);
    } catch (error) {
      if (!this.isShuttingDown) {
        this.logger.error(`Redis SCAN error:`, error.message);
      }
      return ['0', []];
    }
  }

  async flushdb(): Promise<'OK'> {
    if (this.unavailable) return 'OK';
    try {
      return await this.client.flushdb();
    } catch (error) {
      if (!this.isShuttingDown) {
        this.logger.error(`Redis FLUSHDB error:`, error.message);
      }
      return 'OK';
    }
  }

  async flushall(): Promise<'OK'> {
    if (this.unavailable) return 'OK';
    try {
      return await this.client.flushall();
    } catch (error) {
      if (!this.isShuttingDown) {
        this.logger.error(`Redis FLUSHALL error:`, error.message);
      }
      return 'OK';
    }
  }

  // ========================================
  // ✅ IMPROVED: GRACEFUL CLEANUP
  // ========================================

  async onModuleDestroy() {
    if (!this.enabled) return; // nothing to clean up when Redis is disabled
    this.isShuttingDown = true;
    this.logger.log('🔄 Starting Redis cleanup...');

    try {
      // ✅ Disconnect all clients in parallel with timeout
      await Promise.race([
        this.gracefulDisconnect(),
        new Promise((resolve) => setTimeout(resolve, 1500)), // 1.5s timeout
      ]);

      this.logger.log('✅ Redis connections closed successfully');
    } catch (error) {
      // ✅ Silent error handling during shutdown
      this.logger.debug('Redis cleanup completed with warnings');
    }
  }

  /**
   * ✅ IMPROVED: Gracefully disconnect all Redis clients
   */
  private async gracefulDisconnect(): Promise<void> {
    const disconnectClient = async (
      client: Redis,
      name: string,
    ): Promise<void> => {
      try {
        const status = client.status;

        if (
          status === 'ready' ||
          status === 'connecting' ||
          status === 'connect'
        ) {
          // ✅ Use quit() for clean shutdown
          await client.quit();
        } else if (status !== 'end' && status !== 'close') {
          // ✅ Force disconnect if needed
          client.disconnect();
        }
      } catch (error) {
        // ✅ Silent during shutdown - these errors are expected
      }
    };

    // ✅ Disconnect all clients in parallel
    await Promise.all([
      disconnectClient(this.client, 'Main'),
      disconnectClient(this.subscriber, 'Subscriber'),
      disconnectClient(this.publisher, 'Publisher'),
    ]);
  }
}
