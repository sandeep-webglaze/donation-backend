import { SetMetadata } from '@nestjs/common';
import { CACHE_KEY_METADATA } from '../constants/cache.constants';

/**
 * 🔥 @CacheKey() Decorator
 * Sets custom cache key pattern for specific endpoint
 * 
 * USE CASE:
 * - Custom key structure
 * - Include specific parameters
 * - User-specific caching
 * 
 * PATTERNS:
 * - :param - Route parameter (e.g., :id, :category)
 * - :userId - Current user ID from JWT
 * 
 * @param keyPattern - Custom key pattern
 * 
 * @example
 * ```typescript
 * @Get('user/:id/posts')
 * @CacheKey('user-posts::id')
 * getUserPosts(@Param('id') id: string) {
 *   return this.service.getUserPosts(id);
 * }
 * 
 * @Get('my-orders')
 * @CacheKey('orders::userId')
 * getMyOrders(@CurrentUser() user: any) {
 *   return this.service.getOrders(user.userId);
 * }
 * ```
 */
export const CacheKey = (keyPattern: string) =>
  SetMetadata(CACHE_KEY_METADATA, keyPattern);