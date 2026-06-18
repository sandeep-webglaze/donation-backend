// src/config/swagger.config.ts
export default () => ({
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false', // Default true
    path: process.env.SWAGGER_PATH || 'api/docs',
    title: process.env.SWAGGER_TITLE || 'Donation Platform API',
    description: process.env.SWAGGER_DESCRIPTION || 'Donation Platform REST API Documentation',
    version: process.env.SWAGGER_VERSION || '1.0',
  },
});