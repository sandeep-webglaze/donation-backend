import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { CacheService } from './cache.service';
import redisConfig from '../../config/redis.config';

/**
 * 🔥 REDIS MODULE
 * Global module providing Redis and Cache services
 */
@Global()
@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [RedisService, CacheService],
  exports: [RedisService, CacheService],
})
export class RedisModule {}