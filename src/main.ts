import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

// Middleware
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

// Swagger
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Get config values
  const port = configService.get<number>('app.port', 8080);
  const frontendUrl = configService.get<string>(
    'app.frontendUrl',
    'http://localhost:3001',
  );
  const nodeEnv = configService.get<string>('app.env', 'development');
  const corsOrigins = configService.get<string[]>('security.corsOrigins', [
    '*',
  ]);
  const swaggerEnabled =
    configService.get<boolean>('features.enableSwagger') ||
    configService.get<boolean>('swagger.enabled', false);
  const swaggerPath = configService.get<string>('swagger.path', 'api/docs');
  const swaggerTitle = configService.get<string>(
    'swagger.title',
    'Donation Platform API',
  );
  const swaggerDescription = configService.get<string>(
    'swagger.description',
    'Donation Platform REST API Documentation',
  );
  const swaggerVersion = configService.get<string>('swagger.version', '1.0');

  // Global Prefix
  // ✅ Global Prefix with Exclusion for Landing Page
  app.setGlobalPrefix('api', {
    exclude: ['/', 'api'], // Exclude landing page from /api prefix
  });

  // CORS — allow localhost (dev), the configured frontend URL, any origins in
  // CORS_ORIGINS (comma-separated), and all *.vercel.app deployments/previews.
  const envOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080',
    frontendUrl,
    ...envOrigins,
  ].filter(Boolean);

  app.enableCors({
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      // No origin = server-to-server / curl → allow.
      if (!origin) return cb(null, true);
      let host = '';
      try {
        host = new URL(origin).hostname;
      } catch {
        /* ignore */
      }
      const ok =
        allowedOrigins.includes(origin) || /(^|\.)vercel\.app$/.test(host);
      cb(null, ok);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Security & Performance
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production',
      crossOriginEmbedderPolicy: nodeEnv === 'production',
    }),
  );

  app.use(compression());
  app.use(cookieParser());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // Silently strip unknown props (e.g. id/createdAt sent by admin forms)
      // instead of throwing 400 — otherwise every admin "Save" fails.
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger - Conditional
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle(swaggerTitle)
      .setDescription(swaggerDescription)
      .setVersion(swaggerVersion)
      .addTag('Authentication', 'User authentication endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('CMS', 'CMS pages & policies')
      .addTag('Health', 'System health check endpoints')
      .addTag('Routes', 'Route discovery endpoints')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addServer(`http://localhost:${port}`, 'Development Server')
      .addServer(frontendUrl, 'Frontend Server')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup(swaggerPath, app, document, {
      customSiteTitle: `${swaggerTitle} Docs`,
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`📚 Swagger Docs: http://localhost:${port}/${swaggerPath}`);
  }

  // ✅ FIXED: Graceful Shutdown with proper cleanup
  app.enableShutdownHooks();

  let isShuttingDown = false;

  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) {
      logger.warn(`Already shutting down, ignoring ${signal}`);
      return;
    }

    isShuttingDown = true;
    logger.log(`🛑 ${signal} signal received: initiating graceful shutdown`);

    try {
      // Close HTTP server (stop accepting new requests)
      await app.close();
      logger.log('✅ Application closed successfully');

      // Small delay to ensure cleanup completes
      await new Promise((resolve) => setTimeout(resolve, 100));

      logger.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', (error) => {
    logger.error('💥 Uncaught Exception:', error);
    if (!isShuttingDown) {
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason, promise) => {
    // ✅ FIXED: Ignore rejection errors during shutdown
    if (isShuttingDown) {
      logger.debug('Ignoring unhandled rejection during shutdown');
      return;
    }
    logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  // Server Start
  await app.listen(port);

  logger.log(`🚀 Environment: ${nodeEnv}`);
  logger.log(`🚀 API running on: http://localhost:${port}/api`);
  logger.log(`🏠 Landing Page: http://localhost:${port}`);
  logger.log(`🏥 Health Check: http://localhost:${port}/api/health`);

  if (nodeEnv === 'development') {
    logger.log(`🔍 Routes: http://localhost:${port}/api/routes`);
  }
}

bootstrap();
