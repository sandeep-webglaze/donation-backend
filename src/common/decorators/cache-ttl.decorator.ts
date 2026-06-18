import { SetMetadata } from '@nestjs/common';
import { CACHE_TTL_METADATA } from '../constants/cache.constants';

/**
 * 🔥 @CacheTTL() Decorator
 * Sets custom cache TTL (Time To Live) for specific endpoint
 * 
 * USE CASE:
 * - Override default TTL
 * - Set specific expiration time
 * 
 * @param ttl - Time to live in seconds
 * 
 * @example
 * ```typescript
 * @Get('trending')
 * @CacheTTL(60) // Cache for 1 minute
 * getTrendingProducts() {
 *   return this.service.getTrending();
 * }
 * 
 * @Get('featured')
 * @CacheTTL(3600) // Cache for 1 hour
 * getFeaturedProducts() {
 *   return this.service.getFeatured();
 * }
 * ```
 */
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA, ttl);