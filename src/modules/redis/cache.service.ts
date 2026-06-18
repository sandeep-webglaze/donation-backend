import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface CacheOptions {
  ttl?: number;
  namespace?: string;
}

/**
 * 🔥 CACHE SERVICE
 * High-level cache operations with namespace support
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTTL = 300; // 5 minutes

  constructor(private redisService: RedisService) {}

  /**
   * Get cached value
   */
  async get<T>(key: string, namespace?: string): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, namespace);
      const cached = await this.redisService.get(fullKey);
      
      if (!cached) return null;
      
      return JSON.parse(cached) as T;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached value
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options.namespace);
      const ttl = options.ttl || this.defaultTTL;
      const serialized = JSON.stringify(value);
      
      await this.redisService.set(fullKey, serialized, ttl);
      return true;
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async del(key: string, namespace?: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, namespace);
      await this.redisService.del(fullKey);
      return true;
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string, namespace?: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, namespace);
      const result = await this.redisService.exists(fullKey);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set pattern (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    const cached = await this.get<T>(key, options.namespace);
    
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    
    return value;
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string, namespace?: string): Promise<number> {
    try {
      const fullPattern = this.buildKey(pattern, namespace);
      const keys = await this.redisService.keys(fullPattern);
      
      if (keys.length === 0) return 0;
      
      const pipeline = this.redisService.getClient().pipeline();
      keys.forEach((key) => pipeline.del(key));
      await pipeline.exec();
      
      return keys.length;
    } catch (error) {
      this.logger.error(`Cache invalidate pattern error:`, error);
      return 0;
    }
  }

  /**
   * Clear all cache in namespace
   */
  async clearNamespace(namespace: string): Promise<number> {
    return this.invalidatePattern('*', namespace);
  }

  /**
   * Increment counter
   */
  async increment(key: string, namespace?: string): Promise<number> {
    const fullKey = this.buildKey(key, namespace);
    return this.redisService.getClient().incr(fullKey);
  }

  /**
   * Decrement counter
   */
  async decrement(key: string, namespace?: string): Promise<number> {
    const fullKey = this.buildKey(key, namespace);
    return this.redisService.getClient().decr(fullKey);
  }

  /**
   * Get cache statistics
   */
  async getStats(namespace?: string): Promise<{
    totalKeys: number;
    namespace: string;
  }> {
    const pattern = namespace ? `${namespace}:*` : '*';
    const keys = await this.redisService.keys(pattern);
    
    return {
      totalKeys: keys.length,
      namespace: namespace || 'all',
    };
  }

  /**
   * Build full cache key with namespace
   */
  private buildKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }
}