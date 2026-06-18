// src/config/database.config.ts
export default () => ({
  database: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    url: process.env.DB_URL,
  },
});