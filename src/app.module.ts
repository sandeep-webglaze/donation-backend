// ============================================================================
// APP.MODULE.TS - Complete Response System with Detailed Comments
// ============================================================================
// File: src/app.module.ts
// ============================================================================

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// ============================================================================
// 📦 CONFIGURATION FILES - Application Settings
// ============================================================================
// Purpose: Centralized configuration management
// Benefit: Easy to modify settings without changing code
// ============================================================================
import appConfig from './config/app.config'; // App-level settings (port, env, etc.)
import databaseConfig from './config/database.config'; // Database connection settings
import jwtConfig from './config/jwt.config'; // JWT authentication settings
import cloudinaryConfig from './config/cloudinary.config'; // Image upload settings
import awsS3Config from './config/aws-s3.config'; // AWS S3 storage settings
import swaggerConfig from './config/swagger.config'; // API documentation settings
import redisConfig from './config/redis.config'; // Redis cache settings

// ============================================================================
// 🔧 MODULES - Feature Modules
// ============================================================================
// Purpose: Organize application into logical units
// Benefit: Better code organization, reusability, lazy loading
// ============================================================================
import { PrismaModule } from './database/prisma.module'; // PostgreSQL (Prisma) connection
import { EmailAuthModule } from './modules/auth/emails/email-auth.module'; // Authentication & authorization
import { UsersModule } from './modules/users/user.module'; // User management
import { SettingsModule } from './modules/settings/settings.module'; // Website settings
import { CmsModule } from './modules/cms/cms.module'; // CMS pages & policies
import { SeoModule } from './modules/seo/seo.module'; // Per-page SEO manager
import { GalleryModule } from './modules/gallery/gallery.module'; // Gallery (images + videos)
import { MediaModule } from './modules/media/media.module'; // File uploads
import { ContentModule } from './modules/content/content.module'; // Per-section content blocks
import { RedisModule } from './modules/redis/redis.module'; // Redis caching
import { HealthModule } from './modules/health/health.module'; // Health check endpoints
import { RoutesModule } from './modules/routes/routes.module'; // Route listing (dev only)

// ============================================================================
// 🛡️ MIDDLEWARE - Request Processing
// ============================================================================
// Purpose: Process requests before they reach route handlers
// Execution: Runs BEFORE guards, interceptors, and pipes
// Use case: Logging, request ID generation, authentication checks
// ============================================================================
import { LoggerMiddleware } from './common/middleware/logger.middleware'; // Request logging
import { RequestIdMiddleware } from './common/middleware/request-id.middleware'; // Unique request ID

// ============================================================================
// 🔄 INTERCEPTORS - Request/Response Transformation
// ============================================================================
// Purpose: Transform or modify requests/responses
// Execution order: Top to bottom (as listed in providers array)
// Flow: Request → Logging → Timeout → Cache → Response Format → Controller
// ============================================================================
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'; // 1️⃣ Log requests/responses
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor'; // 2️⃣ Add 30s timeout protection
import { RedisCacheInterceptor } from './common/interceptors/cache.interceptor'; // 3️⃣ Check Redis cache before DB
import { ResponseInterceptor } from './common/interceptors/response.interceptor'; // 4️⃣ Format all SUCCESS responses

// ============================================================================
// 🚨 FILTERS - Exception Handling
// ============================================================================
// Purpose: Catch and format all errors/exceptions
// Execution: Runs when ANY error/exception is thrown
// Use case: Consistent error response format across entire app
// ============================================================================
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'; // Format all ERROR responses

// ============================================================================
// 🎯 CONTROLLERS
// ============================================================================
import { AppController } from './app.controller'; // Root controller (landing page, etc.)
import { EmailModule } from './modules/emails/email.module';
import { AwsUploadModule } from './modules/uploads/aws-upload.module';
import { OtpAuthModule } from './modules/auth/otp/otp-auth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  // ==========================================================================
  // 📥 IMPORTS - External Modules
  // ==========================================================================
  imports: [
    // ══════════════════════════════════════════════════════════════════════
    // 🔧 ConfigModule - Environment Configuration
    // ══════════════════════════════════════════════════════════════════════
    // Purpose: Load and manage environment variables and app configuration
    // isGlobal: true → ConfigService available everywhere without re-importing
    // envFilePath: Loads .env.development or .env.production based on NODE_ENV
    // load: Loads all configuration files for type-safe access
    // ══════════════════════════════════════════════════════════════════════
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available in all modules
      // Loads the env-specific file first (wins), then plain `.env` as a fallback.
      // So DATABASE_URL can live ONLY in `.env` (shared with the Prisma CLI) and
      // you don't have to duplicate it. Or put everything in `.env` for one file.
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      load: [
        appConfig, // Application settings (port, env, URLs)
        databaseConfig, // Database connection (MongoDB/PostgreSQL)
        jwtConfig, // JWT secret, expiry, refresh token settings
        cloudinaryConfig, // Cloudinary API keys for image uploads
        swaggerConfig, // Swagger API documentation settings
        redisConfig, // Redis connection for caching
      ],
    }),

    JwtModule.registerAsync({
      global: true, // 🔥 THIS IS THE KEY

      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): any => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: config.get<string>('jwt.expiresIn') as any,
        },
      }),
    }),

    // ══════════════════════════════════════════════════════════════════════
    // 📁 ServeStaticModule - Static File Serving
    // ══════════════════════════════════════════════════════════════════════
    // Purpose: Serve static files like images, favicon, CSS, JS
    // rootPath: Location of static files (public folder)
    // serveRoot: URL path to access files (http://localhost:3000/)
    // exclude: Don't serve static files for /api/* routes
    // ══════════════════════════════════════════════════════════════════════
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // Serve files from /public folder
      serveRoot: '/', // Accessible at root URL
      exclude: ['/api*'], // Don't conflict with API routes
    }),

    // ══════════════════════════════════════════════════════════════════════
    // 🛡️ ThrottlerModule - Rate Limiting
    // ══════════════════════════════════════════════════════════════════════
    // Purpose: Prevent abuse by limiting requests per time window
    // ttl: Time to live (60 seconds = 1 minute)
    // limit: Maximum requests allowed in ttl window
    // Example: Max 100 requests per minute per IP
    // ══════════════════════════════════════════════════════════════════════
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds (1 minute)
        limit: 100, // 100 requests per minute
      },
    ]),

    // ══════════════════════════════════════════════════════════════════════
    // 🗄️ Database Module
    // ══════════════════════════════════════════════════════════════════════
    // Purpose: Establishes MongoDB/PostgreSQL connection
    // Provides: Repository pattern, entity management
    // ══════════════════════════════════════════════════════════════════════
    PrismaModule,

    // ══════════════════════════════════════════════════════════════════════
    // 🚀 Redis Module - Caching Layer
    // ══════════════════════════════════════════════════════════════════════
    // Purpose: In-memory caching for faster response times
    // Use case: Cache frequently accessed data, session storage
    // ══════════════════════════════════════════════════════════════════════
    RedisModule,

    // ══════════════════════════════════════════════════════════════════════
    // 🎯 Feature Modules - Business Logic
    // ══════════════════════════════════════════════════════════════════════
    // Purpose: Separate business logic into modules
    // Benefit: Cleaner code, easier testing, better scalability
    // ══════════════════════════════════════════════════════════════════════
    EmailAuthModule, // Authentication (login, register, JWT, refresh tokens)
    UsersModule, // User management (CRUD operations, profile)
    SettingsModule, // Website settings (header/footer/SEO config)
    CmsModule, // CMS pages & policies (About, Privacy, Terms, etc.)
    SeoModule, // Per-page SEO for coded pages (home, about, contact, ...)
    GalleryModule, // Gallery images + videos
    MediaModule, // File uploads → /public/uploads
    ContentModule, // Per-section editable content blocks
    HealthModule, // Health check endpoints (DB, Redis status)
    EmailModule,
    AwsUploadModule,
    OtpAuthModule,

    // ══════════════════════════════════════════════════════════════════════
    // 🔍 RoutesModule - Route discovery
    // ══════════════════════════════════════════════════════════════════════
    // Always imported because AppController injects RoutesService. The detailed
    // route listing is still only EXPOSED in development (guarded in the
    // controller by NODE_ENV / features.enableRouteDiscovery).
    // ══════════════════════════════════════════════════════════════════════
    RoutesModule,
  ],

  // ==========================================================================
  // 🎮 CONTROLLERS - Route Handlers
  // ==========================================================================
  // Purpose: Handle HTTP requests at root level
  // Example: Landing page, root routes
  // ==========================================================================
  controllers: [AppController],

  // ==========================================================================
  // 🔌 PROVIDERS - Dependency Injection
  // ==========================================================================
  // Purpose: Register global providers (guards, interceptors, filters)
  // Execution Flow: Guard → Interceptor → Controller → Interceptor → Filter
  // ==========================================================================
  providers: [
    // ════════════════════════════════════════════════════════════════════════
    // 🛡️ GUARDS - Access Control
    // ════════════════════════════════════════════════════════════════════════
    // Purpose: Determine if request should be handled
    // Execution: BEFORE interceptors and route handlers
    // Use case: Authentication, authorization, role-based access
    // ════════════════════════════════════════════════════════════════════════
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Rate limiting - blocks excessive requests
    },

    // ════════════════════════════════════════════════════════════════════════
    // 🔄 INTERCEPTORS - Request/Response Pipeline
    // ════════════════════════════════════════════════════════════════════════
    // ⚠️ IMPORTANT: Order matters! Executes TOP to BOTTOM
    // Request Flow:  1 → 2 → 3 → 4 → Controller
    // Response Flow: Controller → 4 → 3 → 2 → 1
    // ════════════════════════════════════════════════════════════════════════

    // ────────────────────────────────────────────────────────────────────────
    // 1️⃣ LoggingInterceptor
    // ────────────────────────────────────────────────────────────────────────
    // Purpose: Log all incoming requests and outgoing responses
    // Logs: Method, URL, status code, response time, request ID
    // Output: 🟢 GET /api/users | 200 | 45ms | RequestID: abc-123
    // Benefit: Debugging, monitoring, performance tracking
    // ────────────────────────────────────────────────────────────────────────
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    // ────────────────────────────────────────────────────────────────────────
    // 2️⃣ TimeoutInterceptor
    // ────────────────────────────────────────────────────────────────────────
    // Purpose: Automatically timeout requests after 30 seconds
    // Prevents: Hanging requests, resource exhaustion
    // Response: 408 Request Timeout if operation takes > 30s
    // Use case: Prevent slow DB queries from blocking server
    // ────────────────────────────────────────────────────────────────────────
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },

    // ────────────────────────────────────────────────────────────────────────
    // 3️⃣ RedisCacheInterceptor
    // ────────────────────────────────────────────────────────────────────────
    // Purpose: Check Redis cache before hitting database
    // Flow: Request → Check cache → If found, return cached data
    //                            → If not found, execute controller & cache result
    // Benefit: Faster responses, reduced DB load
    // Use case: Frequently accessed data (product lists, user profiles)
    // ────────────────────────────────────────────────────────────────────────
    {
      provide: APP_INTERCEPTOR,
      useClass: RedisCacheInterceptor,
    },

    // ────────────────────────────────────────────────────────────────────────
    // 4️⃣ ResponseInterceptor - SUCCESS Response Formatter
    // ────────────────────────────────────────────────────────────────────────
    // Purpose: Automatically format ALL successful responses
    // Input: Any data from controller (user object, array, etc.)
    // Output: Standardized format:
    //   {
    //     success: true,
    //     statusCode: 200,
    //     message: "Success",
    //     data: {...},
    //     timestamp: "2024-01-30T12:00:00.000Z",
    //     path: "/api/users"
    //   }
    // Features:
    //   ✅ Auto-detects pagination
    //   ✅ Handles null/undefined (204 No Content)
    //   ✅ Preserves custom messages
    //   ✅ Works with all HTTP methods (GET, POST, PUT, DELETE)
    // Benefit: Consistent API response format without manual wrapping
    // ────────────────────────────────────────────────────────────────────────
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },

    // ════════════════════════════════════════════════════════════════════════
    // 🚨 EXCEPTION FILTER - ERROR Response Formatter
    // ════════════════════════════════════════════════════════════════════════
    // Purpose: Catch and format ALL errors/exceptions
    // Execution: Runs when ANY error is thrown (404, 500, validation, etc.)
    // Output: Standardized error format:
    //   {
    //     success: false,
    //     statusCode: 404,
    //     error: "Not Found",
    //     message: "User not found",
    //     timestamp: "2024-01-30T12:00:00.000Z",
    //     path: "/api/users/999",
    //     method: "GET",
    //     requestId: "abc-123"
    //   }
    // Features:
    //   ✅ Handles HTTP exceptions (NotFoundException, BadRequestException)
    //   ✅ Handles database errors (duplicate key, validation)
    //   ✅ Handles JWT errors (expired token, invalid token)
    //   ✅ Handles timeout errors
    //   ✅ Pretty logs in development (colored, with hints)
    //   ✅ JSON logs in production (for log aggregators)
    //   ✅ Stack traces only in development
    // Benefit: Consistent error format, better debugging, production-ready logs
    // ════════════════════════════════════════════════════════════════════════
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  // ==========================================================================
  // ⚙️ MIDDLEWARE CONFIGURATION
  // ==========================================================================
  // Purpose: Apply middleware to specific routes
  // Execution: BEFORE guards, interceptors, and controllers
  // ==========================================================================
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        RequestIdMiddleware, // Generate unique ID for each request
        LoggerMiddleware, // Log request details
      )
      .forRoutes('*'); // Apply to ALL routes
  }
}
