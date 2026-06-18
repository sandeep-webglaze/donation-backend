// src/modules/health/health.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  HealthResponseDto,
  ServiceStatus,
  MemoryUsage,
  CPUUsage,
  SystemInfo,
  HealthMetrics,
} from './dto/health-response.dto';
import { RedisService } from '../redis/redis.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private startTime: number;
  private requestCount: number = 0;
  private totalResponseTime: number = 0;
  private errorCount: number = 0;

  constructor(
    private redisService: RedisService,
    private prisma: PrismaService,
  ) {
    this.startTime = Date.now();
  }

  /**
   * ✅ MAIN HEALTH CHECK - All Services
   */
  async checkHealth(): Promise<HealthResponseDto> {
    try {
      const [redisStatus, dbStatus, apiStatus, diskStatus] =
        await Promise.allSettled([
          this.checkRedis(),
          this.checkDatabase(),
          this.checkAPI(),
          this.checkDiskSpace(),
        ]);

      const services: HealthResponseDto['services'] = {
        redis: this.getServiceStatus(redisStatus),
        database: this.getServiceStatus(dbStatus),
        api: this.getServiceStatus(apiStatus),
      };

      // ✅ Conditionally add disk if available
      if (diskStatus.status === 'fulfilled') {
        services.disk = diskStatus.value;
      }

      const overallStatus = this.calculateOverallStatus(services);

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        uptime: this.getUptime(),
        services,
        memory: this.getMemoryUsage(),
        cpu: this.getCPUUsage(),
        system: this.getSystemInfo(),
        metrics: this.getMetrics(),
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);

      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        uptime: this.getUptime(),
        services: {
          redis: { status: 'unhealthy' },
          database: { status: 'unhealthy' },
          api: { status: 'unhealthy' },
        },
        memory: this.getMemoryUsage(),
        cpu: this.getCPUUsage(),
        error: error.message,
      };
    }
  }

  /**
   * ✅ QUICK HEALTH CHECK - Load Balancer ke liye
   */
  async checkHealthQuick(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * ✅ IMPROVED: REDIS HEALTH CHECK - Enhanced with shutdown check
   */
  private async checkRedis(): Promise<ServiceStatus> {
    const startTime = Date.now();

    try {
      // ✅ Check if Redis is healthy first
      if (!this.redisService.isHealthy()) {
        return {
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          details: {
            error: 'Redis service not available',
            connected: false,
          },
        };
      }

      const testKey = 'health:check';

      // Test write
      await this.redisService.set(testKey, 'ok', 10);

      // Test read
      const value = await this.redisService.get(testKey);

      // Test delete
      await this.redisService.del(testKey);

      const responseTime = Date.now() - startTime;

      if (value !== 'ok') {
        throw new Error('Redis read/write test failed');
      }

      // Get Redis info
      const client = this.redisService.getClient();
      
      // ✅ Check client status before calling info
      if (client.status !== 'ready') {
        throw new Error(`Redis client not ready. Status: ${client.status}`);
      }

      const [statsInfo, memoryInfo, serverInfo] = await Promise.all([
        client.info('stats'),
        client.info('memory'),
        client.info('server'),
      ]);

      return {
        status: responseTime < 100 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          connected: true,
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          version: this.parseRedisInfo(serverInfo, 'redis_version'),
          uptime: `${Math.floor(parseInt(this.parseRedisInfo(serverInfo, 'uptime_in_seconds') || '0') / 60)} minutes`,

          // Performance metrics
          operationsPerSecond: this.parseRedisInfo(
            statsInfo,
            'instantaneous_ops_per_sec',
          ),
          connectedClients: this.parseRedisInfo(statsInfo, 'connected_clients'),
          totalCommands: this.parseRedisInfo(
            statsInfo,
            'total_commands_processed',
          ),

          // Memory usage
          usedMemory: this.parseRedisInfo(memoryInfo, 'used_memory_human'),
          usedMemoryPeak: this.parseRedisInfo(
            memoryInfo,
            'used_memory_peak_human',
          ),
          memoryFragmentationRatio: this.parseRedisInfo(
            memoryInfo,
            'mem_fragmentation_ratio',
          ),

          // Cache stats
          keyspaceHits: this.parseRedisInfo(statsInfo, 'keyspace_hits'),
          keyspaceMisses: this.parseRedisInfo(statsInfo, 'keyspace_misses'),
          hitRate: this.calculateRedisHitRate(statsInfo),
        },
      };
    } catch (error) {
      this.logger.error('Redis health check failed:', error);

      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
          connected: false,
        },
      };
    }
  }

  /**
   * ✅ POSTGRESQL HEALTH CHECK (Prisma)
   */
  private async checkDatabase(): Promise<ServiceStatus> {
    const startTime = Date.now();

    try {
      // Lightweight round-trip to confirm the connection is alive
      await this.prisma.$queryRaw`SELECT 1`;

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 100 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          connected: true,
          engine: 'postgresql',
          orm: 'prisma',
        },
      };
    } catch (error) {
      this.logger.error('PostgreSQL health check failed:', error);

      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
          connected: false,
        },
      };
    }
  }

  /**
   * ✅ API HEALTH CHECK - Enhanced
   */
  private async checkAPI(): Promise<ServiceStatus> {
    const startTime = Date.now();

    try {
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        details: {
          version: process.env.npm_package_version || '1.0.0',
          nodeVersion: process.version,
          platform: process.platform,
          pid: process.pid,
          arch: process.arch,

          // Request metrics
          totalRequests: this.requestCount,
          errorRate: this.getErrorRate(),
          averageResponseTime: this.getAverageResponseTime(),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
        },
      };
    }
  }

  /**
   * ✅ DISK SPACE CHECK - NEW
   */
  private async checkDiskSpace(): Promise<ServiceStatus> {
    const startTime = Date.now();

    try {
      let usagePercent = 0;
      let totalGB = '';
      let usedGB = '';
      let availableGB = '';

      if (process.platform === 'win32') {
        // Windows - Simplified
        usagePercent = 0;
        totalGB = 'N/A';
        usedGB = 'N/A';
        availableGB = 'N/A';
      } else {
        // Linux/Mac
        const { stdout } = await execAsync('df -h / | tail -1');
        const parts = stdout.trim().split(/\s+/);

        // Format: Filesystem Size Used Avail Use% Mounted
        totalGB = parts[1] || 'N/A';
        usedGB = parts[2] || 'N/A';
        availableGB = parts[3] || 'N/A';
        usagePercent = parseInt(parts[4]?.replace('%', '') || '0');
      }

      const status =
        usagePercent < 80
          ? 'healthy'
          : usagePercent < 90
            ? 'degraded'
            : 'unhealthy';

      return {
        status,
        responseTime: Date.now() - startTime,
        details: {
          usage: `${usagePercent}%`,
          usagePercent, // ✅ Number format
          total: totalGB,
          used: usedGB,
          available: availableGB,
          warning: usagePercent > 80 ? 'Disk space running low' : null,
          critical: usagePercent > 90 ? 'CRITICAL: Disk space critical!' : null,
        },
      };
    } catch (error) {
      this.logger.error('Disk space check failed:', error);

      return {
        status: 'healthy', // Don't fail health if disk check fails
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
          note: 'Disk check not available on this system',
        },
      };
    }
  }

  /**
   * ✅ SYSTEM INFO - Type Fixed
   */
  private getSystemInfo(): SystemInfo {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'Unknown',

      totalMemory: `${Math.round(totalMemory / 1024 / 1024 / 1024)} GB`,
      freeMemory: `${Math.round(freeMemory / 1024 / 1024 / 1024)} GB`,
      usedMemory: `${Math.round(usedMemory / 1024 / 1024 / 1024)} GB`,
      memoryUsagePercent: Math.round((usedMemory / totalMemory) * 100),

      loadAverage: os.loadavg(),
      uptime: `${Math.floor(os.uptime() / 60)} minutes`,
    };
  }

  /**
   * ✅ METRICS - Type Fixed
   */
  private getMetrics(): HealthMetrics {
    return {
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      errorRate: this.getErrorRate(),
      averageResponseTime: this.getAverageResponseTime(),
      successRate: this.getSuccessRate(),
    };
  }

  /**
   * ✅ HELPER: Record Request (Call from interceptor)
   */
  recordRequest(responseTime: number, isError: boolean = false) {
    this.requestCount++;
    this.totalResponseTime += responseTime;

    if (isError) {
      this.errorCount++;
    }
  }

  /**
   * ✅ HELPER: Calculate Redis Hit Rate
   */
  private calculateRedisHitRate(info: string): string {
    const hits = parseInt(this.parseRedisInfo(info, 'keyspace_hits')) || 0;
    const misses = parseInt(this.parseRedisInfo(info, 'keyspace_misses')) || 0;
    const total = hits + misses;

    if (total === 0) return '0%';

    const hitRate = ((hits / total) * 100).toFixed(2);
    return `${hitRate}%`;
  }

  /**
   * ✅ HELPER: Parse Redis Info
   */
  private parseRedisInfo(info: string, key: string): string {
    const match = info.match(new RegExp(`${key}:(.+)`));
    return match ? match[1].trim() : 'N/A';
  }

  /**
   * ✅ HELPER: CPU Usage - Type Fixed
   */
  private getCPUUsage(): CPUUsage {
    const usage = process.cpuUsage();
    const cpus = os.cpus();

    return {
      user: Math.round(usage.user / 1000), // ms
      system: Math.round(usage.system / 1000), // ms
      cores: cpus.length,
      loadAverage: os.loadavg(),
    };
  }

  /**
   * ✅ HELPER: Memory Usage - Type Fixed
   */
  private getMemoryUsage(): MemoryUsage {
    const usage = process.memoryUsage();
    const totalMemory = usage.heapTotal;
    const usedMemory = usage.heapUsed;

    return {
      heap: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round((usedMemory / totalMemory) * 100),
      },
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024), // MB
    };
  }

  /**
   * ✅ HELPER: Service Status
   */
  private getServiceStatus(
    result: PromiseSettledResult<ServiceStatus>,
  ): ServiceStatus {
    if (result.status === 'fulfilled') {
      return result.value;
    }

    return {
      status: 'unhealthy',
      details: {
        error: result.reason?.message || 'Unknown error',
      },
    };
  }

  /**
   * ✅ HELPER: Calculate Overall Status
   */
  private calculateOverallStatus(services: any): 'ok' | 'error' | 'degraded' {
    const statuses = Object.values(services).map(
      (service: any) => service.status,
    );

    if (statuses.every((status) => status === 'healthy')) {
      return 'ok';
    }

    if (statuses.some((status) => status === 'unhealthy')) {
      return 'error';
    }

    return 'degraded';
  }

  /**
   * ✅ HELPER: Uptime
   */
  private getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * ✅ HELPER: Error Rate
   */
  private getErrorRate(): string {
    if (this.requestCount === 0) return '0%';
    return `${((this.errorCount / this.requestCount) * 100).toFixed(2)}%`;
  }

  /**
   * ✅ HELPER: Average Response Time
   */
  private getAverageResponseTime(): number {
    if (this.requestCount === 0) return 0;
    return Math.round(this.totalResponseTime / this.requestCount);
  }

  /**
   * ✅ HELPER: Success Rate
   */
  private getSuccessRate(): string {
    if (this.requestCount === 0) return '100%';
    const successCount = this.requestCount - this.errorCount;
    return `${((successCount / this.requestCount) * 100).toFixed(2)}%`;
  }
}