// src/config/jwt.config.ts
export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
});
