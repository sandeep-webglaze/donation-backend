import { SetMetadata } from '@nestjs/common';
import { NO_CACHE_METADATA } from '../constants/cache.constants';

/**
 * 🔥 @NoCache() Decorator
 * Disables caching for specific endpoint
 * 
 * USE CASE:
 * - Sensitive data (balance, wallet, etc.)
 * - Real-time data (notifications, chat)
 * - Frequently changing data
 * 
 * @example
 * ```typescript
 * @Get('balance')
 * @NoCache()
 * getUserBalance() {
 *   return this.service.getBalance();
 * }
 * ```
 */
export const NoCache = () => SetMetadata(NO_CACHE_METADATA, true);