import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, tap, catchError, throwError } from 'rxjs';
import { Request } from 'express';
import { CacheService } from '../../modules/redis/cache.service';
import {
  CACHE_CONFIG,
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
  NO_CACHE_METADATA,
} from '../constants/cache.constants';

/**
 * 🔥 IMPROVED REDIS CACHE INTERCEPTOR
 * - Better error handling
 * - Faster cache key generation
 * - Cache statistics tracking
 * - Handles race conditions
 */
@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RedisCacheInterceptor.name);
  
  // ✅ Track cache performance
  private cacheStats = {
    hits: 0,
    misses: 0,
    errors: 0,
  };

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {
    // Log stats every 5 minutes
    setInterval(() => this.logStats(), 5 * 60 * 1000);
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const url = request.url;

    // 1️⃣ Check if caching is disabled
    const noCacheEnabled = this.reflector.get<boolean>(
      NO_CACHE_METADATA,
      context.getHandler(),
    );

    if (noCacheEnabled) {
      return next.handle();
    }

    // 2️⃣ Check if route is excluded
    if (this.isExcludedRoute(url)) {
      return next.handle();
    }

    // 3️⃣ Handle GET requests (CACHE)
    if (CACHE_CONFIG.CACHEABLE_METHODS.includes(method)) {
      return this.handleCacheableRequest(context, next);
    }

    // 4️⃣ Handle POST/PUT/PATCH/DELETE (INVALIDATE)
    if (CACHE_CONFIG.INVALIDATE_METHODS.includes(method)) {
      return this.handleInvalidationRequest(context, next);
    }

    return next.handle();
  }

  /**
   * ✅ Handle GET requests - Cache response
   */
  private async handleCacheableRequest(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const cacheKey = this.generateCacheKey(context);
    const namespace = this.getNamespace(request.url);

    try {
      // Try to get from cache
      const cachedResponse = await this.cacheService.get(cacheKey, namespace);

      if (cachedResponse !== null && cachedResponse !== undefined) {
        this.cacheStats.hits++;
        this.logger.debug(
          `✅ Cache HIT: ${cacheKey} (${this.cacheStats.hits}/${this.getTotalRequests()})`,
        );
        return of(cachedResponse);
      }

      this.cacheStats.misses++;
      this.logger.debug(
        `❌ Cache MISS: ${cacheKey} (${this.cacheStats.misses}/${this.getTotalRequests()})`,
      );

      const ttl = this.getTTL(context, request.url);

      // ✅ Execute request and cache result
      return next.handle().pipe(
        tap(async (response) => {
          // ✅ Only cache successful responses
          if (response !== null && response !== undefined) {
            try {
              await this.cacheService.set(cacheKey, response, { ttl, namespace });
              this.logger.debug(`💾 Cached: ${cacheKey} (TTL: ${ttl}s)`);
            } catch (cacheError) {
              // ✅ Don't fail the request if caching fails
              this.cacheStats.errors++;
              this.logger.warn(`⚠️ Cache set failed: ${cacheError.message}`);
            }
          }
        }),
        catchError((error) => {
          this.logger.error(`❌ Request failed: ${error.message}`);
          return throwError(() => error);
        }),
      );
    } catch (error) {
      // ✅ If cache read fails, proceed without cache
      this.cacheStats.errors++;
      this.logger.warn(`⚠️ Cache read failed: ${error.message}, proceeding without cache`);
      return next.handle();
    }
  }

  /**
   * Handle POST/PUT/PATCH/DELETE - Invalidate cache
   */
  private async handleInvalidationRequest(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const namespace = this.getNamespace(request.url);

    return next.handle().pipe(
      tap(async () => {
        try {
          const invalidated = await this.cacheService.clearNamespace(namespace);
          this.logger.debug(`🗑️ Invalidated ${invalidated} keys in: ${namespace}`);
          await this.invalidateRelatedCaches(request.url);
        } catch (error) {
          this.logger.warn(`⚠️ Cache invalidation failed: ${error.message}`);
        }
      }),
    );
  }

  /**
   * ✅ OPTIMIZED: Faster cache key generation
   */
  private generateCacheKey(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest<Request>();

    // Check for custom key
    const customKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    if (customKey) {
      return this.buildCustomKey(customKey, request);
    }

    const { url, method } = request;
    const user = (request as any).user;
    
    // ✅ Simple split (faster than complex parsing)
    const [path, queryString] = url.split('?');
    
    // ✅ Build key parts array (faster than string concatenation)
    const keyParts = [method, path];

    // ✅ Only add query if exists
    if (queryString) {
      // ✅ Sort params for consistent keys
      const params = new URLSearchParams(queryString);
      const sortedQuery = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      keyParts.push(sortedQuery);
    }

    // ✅ Add user ID if authenticated
    if (user?.userId) {
      keyParts.push(`user:${user.userId}`);
    }

    return keyParts.join(':');
  }

  /**
   * Build custom key
   */
  private buildCustomKey(pattern: string, request: Request): string {
    let key = pattern;

    const params = (request as any).params || {};
    Object.keys(params).forEach((param) => {
      key = key.replace(`:${param}`, params[param]);
    });

    if (key.includes(':userId')) {
      const user = (request as any).user;
      key = key.replace(':userId', user?.userId || 'anonymous');
    }

    return key;
  }

  /**
   * Get namespace from URL
   */
  private getNamespace(url: string): string {
    const path = url.split('?')[0];
    const segments = path.split('/').filter(Boolean);
    // Use second-to-last segment for better grouping
    return segments[segments.length - 2] || segments[0] || 'default';
  }

  /**
   * Get TTL
   */
  private getTTL(context: ExecutionContext, url: string): number {
    const decoratorTTL = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    );
    if (decoratorTTL) return decoratorTTL;

    const path = url.split('?')[0];
    for (const [route, ttl] of Object.entries(CACHE_CONFIG.ROUTE_TTL_MAP)) {
      const regex = new RegExp(`^${route}$`);
      if (regex.test(path)) {
        return ttl;
      }
    }

    return CACHE_CONFIG.TTL.MEDIUM;
  }

  /**
   * Check excluded routes
   */
  private isExcludedRoute(url: string): boolean {
    const path = url.split('?')[0];
    return CACHE_CONFIG.EXCLUDED_ROUTES.some((pattern) => pattern.test(path));
  }

  /**
   * Invalidate related caches
   */
  private async invalidateRelatedCaches(url: string): Promise<void> {
    const namespace = this.getNamespace(url);
    const relationships = CACHE_CONFIG.INVALIDATION_RELATIONSHIPS[namespace];

    if (relationships) {
      for (const related of relationships) {
        try {
          await this.cacheService.clearNamespace(related);
          this.logger.debug(`🗑️ Cleared related: ${related}`);
        } catch (error) {
          this.logger.warn(`⚠️ Failed to clear related cache: ${related}`);
        }
      }
    }
  }

  /**
   * ✅ Get total requests
   */
  private getTotalRequests(): number {
    return this.cacheStats.hits + this.cacheStats.misses;
  }

  /**
   * ✅ Log cache statistics
   */
  private logStats(): void {
    const total = this.getTotalRequests();
    if (total === 0) return;

    const hitRate = ((this.cacheStats.hits / total) * 100).toFixed(2);
    
    this.logger.log('📊 Cache Statistics:');
    this.logger.log(`   Hits: ${this.cacheStats.hits} (${hitRate}%)`);
    this.logger.log(`   Misses: ${this.cacheStats.misses}`);
    this.logger.log(`   Errors: ${this.cacheStats.errors}`);
    this.logger.log(`   Total: ${total}`);
  }
}