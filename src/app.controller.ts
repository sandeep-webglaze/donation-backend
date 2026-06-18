import { Controller, Get, Header, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import express from 'express';
import { RoutesService, RouteInfo } from './modules/routes/routes.service';
import { NoCache } from './common/decorators/no-cache.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly routesService: RoutesService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @NoCache()
  @Header('Content-Type', 'text/html')
  getWelcome(@Res() res: express.Response) {
    const env = this.configService.get<string>('app.env');
    const isProduction = env === 'production';
    try {
      if (isProduction) {
        const html = this.getProductionLandingPage();
        return res.send(html);
      }

      const routes = this.routesService.getGroupedRoutes();
      const stats = this.routesService.getRouteStats();
      const html = this.getDevelopmentLandingPage(routes, stats);
      return res.send(html);
    } catch (error) {
      // ✅ If route discovery fails, show error page
      const errorHtml = this.getErrorPage(error);
      return res.status(500).send(errorHtml);
    }
  }

  @Get('api')
  @NoCache()
  getApiInfo() {
    const env = this.configService.get<string>('app.env');
    const isProduction = env === 'production';
    const enableRouteDiscovery = this.configService.get<boolean>(
      'features.enableRouteDiscovery',
    );

    const baseInfo = {
      success: true,
      message: 'API Information',
      version: '1.0.0',
      status: 'active',
      server: {
        environment: env,
        nodeVersion: process.version,
        uptime: Math.floor(process.uptime()),
      },
      documentation: {
        swagger: '/api/docs',
      },
      quickLinks: {
        health: '/api/health',
        healthStatus: '/api/health/status',
        healthMongoDB: '/api/health/mongodb',
        healthRedis: '/api/health/redis',
        healthMemory: '/api/health/memory',
        healthCPU: '/api/health/cpu',
      },
      timestamp: new Date().toISOString(),
    };

    if (!isProduction || enableRouteDiscovery) {
      try {
        const routes = this.routesService.getAllRoutes();
        const stats = this.routesService.getRouteStats();

        return {
          ...baseInfo,
          statistics: stats,
          totalEndpoints: routes.length,
          allRoutes: '/api/routes',
          groupedRoutes: '/api/routes/grouped',
          routeStats: '/api/routes/stats',
        };
      } catch (error) {
        return {
          ...baseInfo,
          error: 'Route discovery failed',
          message: error.message,
        };
      }
    }

    return baseInfo;
  }

  private getProductionLandingPage(): string {
    const frontendUrl = this.configService.get<string>('app.frontendUrl');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Server</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          
          .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 3rem;
            text-align: center;
            max-width: 600px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
          }
          
          h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
          }
          
          p {
            font-size: 1.2rem;
            opacity: 0.9;
            margin: 1rem 0;
          }
          
          .status {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(16, 185, 129, 0.2);
            padding: 0.75rem 1.5rem;
            border-radius: 24px;
            margin: 1.5rem 0;
            font-weight: 500;
          }
          
          .status-dot {
            width: 10px;
            height: 10px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          .links {
            margin-top: 2rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          
          a {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 0.875rem 1.75rem;
            border-radius: 8px;
            text-decoration: none;
            transition: all 0.2s;
            font-weight: 500;
          }
          
          a:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
          }
          
          .footer {
            font-size: 0.85rem;
            margin-top: 2rem;
            opacity: 0.7;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 API Server</h1>
          
          <div class="status">
            <span class="status-dot"></span>
            <span>Active & Running</span>
          </div>
          
          <p>Welcome to our REST API service</p>
          
          <div class="links">
            <a href="/api/docs">📚 API Documentation</a>
            <a href="/api/health">💚 Health Check</a>
            ${frontendUrl ? `<a href="${frontendUrl}">🌐 Go to App</a>` : ''}
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} - All rights reserved</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getDevelopmentLandingPage(
    routes: Record<string, RouteInfo[]>,
    stats: {
      total: number;
      byMethod: Record<string, number>;
      byController: Record<string, number>;
      modules: string[];
    },
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NestJS API Server - Development</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            min-height: 100vh;
            padding: 2rem;
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .dev-badge {
            display: inline-block;
            background: rgba(251, 191, 36, 0.3);
            color: #fbbf24;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: bold;
            margin-bottom: 1rem;
          }
          
          h1 {
            font-size: 3rem;
            margin-bottom: 0.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
          }
          
          .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 2rem;
          }
          
          .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 2rem;
            margin: 1.5rem 0;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
          }
          
          .card h2 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
          }
          
          .stat-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
          }
          
          .stat-number {
            font-size: 2rem;
            font-weight: bold;
            display: block;
            margin-bottom: 0.25rem;
          }
          
          .stat-label {
            font-size: 0.85rem;
            opacity: 0.8;
          }
          
          .endpoint {
            background: rgba(255, 255, 255, 0.05);
            padding: 0.75rem 1rem;
            margin: 0.5rem 0;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 1rem;
            transition: all 0.2s;
          }
          
          .endpoint:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateX(5px);
          }
          
          .method {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.75rem;
            min-width: 60px;
            text-align: center;
          }
          
          .GET { background: #10b981; color: white; }
          .POST { background: #3b82f6; color: white; }
          .PUT { background: #f59e0b; color: white; }
          .PATCH { background: #8b5cf6; color: white; }
          .DELETE { background: #ef4444; color: white; }
          
          .path {
            font-family: 'Courier New', monospace;
            flex: 1;
          }
          
          .controller-name {
            font-size: 0.75rem;
            opacity: 0.7;
          }
          
          a {
            color: #fff;
            text-decoration: none;
            transition: opacity 0.2s;
          }
          
          a:hover {
            opacity: 0.8;
            text-decoration: underline;
          }
          
          .link-button {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            margin: 0.5rem 0.5rem 0.5rem 0;
            transition: all 0.2s;
          }
          
          .link-button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
          }
          
          .module-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.85rem;
            margin-left: 0.5rem;
          }

          .warning {
            background: rgba(239, 68, 68, 0.2);
            border-left: 4px solid #ef4444;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
          }

          .health-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
          }

          .health-item {
            background: rgba(16, 185, 129, 0.15);
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            transition: all 0.2s;
            cursor: pointer;
            border: 1px solid rgba(16, 185, 129, 0.3);
          }

          .health-item:hover {
            background: rgba(16, 185, 129, 0.25);
            transform: translateY(-2px);
          }

          .health-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
          }

          .health-label {
            font-size: 0.9rem;
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="dev-badge">⚠️ DEVELOPMENT MODE</div>
          <h1>🚀 NestJS API Server</h1>
          <p class="subtitle">Production-ready REST API with auto route discovery</p>
          
          <div class="warning">
            <strong>⚠️ Warning:</strong> This detailed view is only shown in development mode. 
            In production, a simplified landing page will be displayed for security.
          </div>
          
          <div class="card">
            <h2>📊 Server Status</h2>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-number">✅</span>
                <span class="stat-label">Running</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">${Math.floor(process.uptime())}s</span>
                <span class="stat-label">Uptime</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">${stats.total}</span>
                <span class="stat-label">Endpoints</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">${process.env.NODE_ENV || 'dev'}</span>
                <span class="stat-label">Environment</span>
              </div>
            </div>
          </div>
          
          <div class="card">
            <h2>💚 Health Monitoring</h2>
            <p style="opacity: 0.8; margin-bottom: 1rem;">
              Monitor system health, dependencies, and performance metrics
            </p>
            <div class="health-grid">
              <a href="/api/health" style="text-decoration: none;">
                <div class="health-item">
                  <div class="health-icon">🏥</div>
                  <div class="health-label">Complete Health</div>
                </div>
              </a>
              <a href="/api/health/status" style="text-decoration: none;">
                <div class="health-item">
                  <div class="health-icon">✅</div>
                  <div class="health-label">Quick Status</div>
                </div>
              </a>
              <a href="/api/health/mongodb" style="text-decoration: none;">
                <div class="health-item">
                  <div class="health-icon">🗄️</div>
                  <div class="health-label">MongoDB</div>
                </div>
              </a>
              <a href="/api/health/redis" style="text-decoration: none;">
                <div class="health-item">
                  <div class="health-icon">🔴</div>
                  <div class="health-label">Redis Cache</div>
                </div>
              </a>
              <a href="/api/health/memory" style="text-decoration: none;">
                <div class="health-item">
                  <div class="health-icon">💾</div>
                  <div class="health-label">Memory Usage</div>
                </div>
              </a>
              <a href="/api/health/cpu" style="text-decoration: none;">
                <div class="health-item">
                  <div class="health-icon">⚡</div>
                  <div class="health-label">CPU Usage</div>
                </div>
              </a>
            </div>
          </div>

          <div class="card">
            <h2>📚 API Documentation</h2>
            <a href="/api/docs" class="link-button">📖 Swagger UI</a>
            <a href="/api" class="link-button">ℹ️ API Info</a>
            <a href="/api/routes" class="link-button">🔍 All Routes</a>
            <a href="/api/routes/stats" class="link-button">📈 Statistics</a>
          </div>

          <div class="card">
            <h2>📊 Routes by Method</h2>
            <div class="stats-grid">
              ${Object.entries(stats.byMethod)
                .map(
                  ([method, count]) => `
                  <div class="stat-item">
                    <span class="stat-number ${method}">${count}</span>
                    <span class="stat-label">${method}</span>
                  </div>
                `,
                )
                .join('')}
            </div>
          </div>

          ${Object.entries(routes)
            .map(
              ([module, endpoints]: [string, RouteInfo[]]) => `
              <div class="card">
                <h2>
                  📦 ${module.charAt(0).toUpperCase() + module.slice(1)}
                  <span class="module-badge">${endpoints.length} routes</span>
                </h2>
                ${endpoints
                  .map(
                    (e: RouteInfo) => `
                  <div class="endpoint">
                    <span class="method ${e.method}">${e.method}</span>
                    <span class="path">${e.path}</span>
                    <span class="controller-name">${e.controller}.${e.handler}</span>
                  </div>
                `,
                  )
                  .join('')}
              </div>
            `,
            )
            .join('')}
          
          <div class="card" style="text-align: center; opacity: 0.8;">
            <p>Built with ❤️ using NestJS</p>
            <p style="font-size: 0.85rem; margin-top: 0.5rem;">
              ${new Date().toISOString()}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getErrorPage(error: any): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Server - Error</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          
          .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 3rem;
            text-align: center;
            max-width: 600px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
          }
          
          h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
          }
          
          .error-box {
            background: rgba(0, 0, 0, 0.2);
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            font-family: monospace;
            text-align: left;
          }
          
          a {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 0.875rem 1.75rem;
            border-radius: 8px;
            text-decoration: none;
            margin-top: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚠️ Error</h1>
          <p>Failed to load landing page</p>
          <div class="error-box">
            ${error.message || 'Unknown error'}
          </div>
          <a href="/api/health">Check Server Health</a>
        </div>
      </body>
      </html>
    `;
  }
}
