export default () => ({
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '8080', 10),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  },
  features: {
    enableRouteDiscovery:
      process.env.ENABLE_ROUTE_DISCOVERY === 'true' ||
      process.env.NODE_ENV === 'development',
    enableSwagger:
      process.env.ENABLE_SWAGGER === 'true' ||
      process.env.NODE_ENV === 'development',
    showDetailedErrors: process.env.SHOW_DETAILED_ERRORS === 'true',
    enableCache: process.env.ENABLE_CACHE === 'true',
  },
  security: {
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60000', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
});