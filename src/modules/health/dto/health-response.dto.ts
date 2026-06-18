// src/modules/health/dto/health-response.dto.ts
export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded';

export interface ServiceStatus {
  status: HealthStatus;
  responseTime?: number;
  details?: Record<string, any>;
}

export interface MemoryUsage {
  heap: {
    used: number;
    total: number;
    percentage: number;
  };
  rss: number;
  external: number;
  arrayBuffers: number;
}

export interface CPUUsage {
  user: number;
  system: number;
  cores: number;
  loadAverage: number[];
}

export interface SystemInfo {
  hostname: string;
  platform: string;
  arch: string;
  cpus: number;
  cpuModel: string;
  totalMemory: string;
  freeMemory: string;
  usedMemory: string;
  memoryUsagePercent: number;
  loadAverage: number[];
  uptime: string;
}

export interface HealthMetrics {
  totalRequests: number;
  totalErrors: number;
  errorRate: string;
  averageResponseTime: number;
  successRate: string;
}

export interface HealthResponseDto {
  status: 'ok' | 'error' | 'degraded';
  timestamp: string;
  environment: string;
  version: string;
  uptime: number;
  
  services: {
    redis: ServiceStatus;
    database: ServiceStatus;
    api: ServiceStatus;
    disk?: ServiceStatus; // ✅ OPTIONAL - Added
  };
  
  memory?: MemoryUsage; // ✅ Updated structure
  cpu?: CPUUsage; // ✅ Updated structure
  system?: SystemInfo; // ✅ NEW
  metrics?: HealthMetrics; // ✅ NEW
  
  error?: string;
}