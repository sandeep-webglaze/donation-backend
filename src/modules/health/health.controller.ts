// src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { NoCache } from 'src/common/decorators/no-cache.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * ✅ Complete health check
   * Checks: MongoDB, Redis, Memory, CPU, Disk, System
   */
  @Get()
  @NoCache()
  async checkHealth() {
    return this.healthService.checkHealth();
  }

  /**
   * ✅ Quick health check (no dependencies)
   * Use this for load balancers or simple uptime checks
   */
  @Get('status')
  @NoCache()
  async getStatus() {
    return this.healthService.checkHealthQuick();
  }

  /**
   * ✅ Database-specific health check (PostgreSQL)
   */
  @Get('database')
  @NoCache()
  async checkDatabase() {
    const health = await this.healthService.checkHealth();
    return {
      status: health.services.database.status,
      timestamp: health.timestamp,
      responseTime: health.services.database.responseTime,
      details: health.services.database.details,
    };
  }

  /**
   * ✅ Redis-specific health check
   */
  @Get('redis')
  @NoCache()
  async checkRedis() {
    const health = await this.healthService.checkHealth();
    return {
      status: health.services.redis.status,
      timestamp: health.timestamp,
      responseTime: health.services.redis.responseTime,
      details: health.services.redis.details,
    };
  }

  /**
   * ✅ Memory usage check
   */
  @Get('memory')
  @NoCache()
  async checkMemory() {
    const health = await this.healthService.checkHealth();
    return {
      status: 'ok',
      timestamp: health.timestamp,
      memory: health.memory,
    };
  }

  /**
   * ✅ CPU usage check
   */
  @Get('cpu')
  @NoCache()
  async checkCPU() {
    const health = await this.healthService.checkHealth();
    return {
      status: 'ok',
      timestamp: health.timestamp,
      cpu: health.cpu,
    };
  }

  /**
   * ✅ Disk space check -
   */
  @Get('disk')
  @NoCache()
  async checkDisk() {
    const health = await this.healthService.checkHealth();
    return {
      status: health.services.disk?.status || 'unknown',
      timestamp: health.timestamp,
      responseTime: health.services.disk?.responseTime,
      details: health.services.disk?.details || {
        note: 'Disk check unavailable',
      },
    };
  }

  /**
   * ✅ System info -
   */
  @Get('system')
  @NoCache()
  async getSystemInfo() {
    const health = await this.healthService.checkHealth();
    return {
      status: 'ok',
      timestamp: health.timestamp,
      system: health.system,
    };
  }

  /**
   * ✅ Metrics -
   */
  @Get('metrics')
  @NoCache()
  async getMetrics() {
    const health = await this.healthService.checkHealth();
    return {
      status: 'ok',
      timestamp: health.timestamp,
      metrics: health.metrics,
    };
  }

  /**
   * ✅ API-specific health check
   */
  @Get('api')
  @NoCache()
  async checkAPI() {
    const health = await this.healthService.checkHealth();
    return {
      status: health.services.api.status,
      timestamp: health.timestamp,
      responseTime: health.services.api.responseTime,
      details: health.services.api.details,
    };
  }
}
