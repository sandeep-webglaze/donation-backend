// src/modules/redis/cache-invalidation.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';

@Injectable()
export class CacheInvalidationService {
  private readonly logger = new Logger(CacheInvalidationService.name);

  constructor(private cacheService: CacheService) {}

  /**
   * Invalidate user-specific cache
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const patterns = [
      `user:${userId}:*`,
      `orders:${userId}:*`,
      `cart:${userId}:*`,
    ];

    for (const pattern of patterns) {
      const count = await this.cacheService.invalidatePattern(pattern);
      this.logger.log(`Invalidated ${count} keys for pattern: ${pattern}`);
    }
  }

  /**
   * Invalidate product cache
   */
  async invalidateProductCache(productId: string): Promise<void> {
    await this.cacheService.invalidatePattern(`product:${productId}:*`);
    await this.cacheService.invalidatePattern('products:list:*');
  }

  /**
   * Invalidate all caches (use carefully!)
   */
  async invalidateAll(): Promise<void> {
    const count = await this.cacheService.clearNamespace('myapp');
    this.logger.warn(`Invalidated ALL cache: ${count} keys`);
  }
}