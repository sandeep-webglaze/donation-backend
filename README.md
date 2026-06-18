# Donation Platform — Backend (NestJS + Prisma + PostgreSQL)

REST API for the donation/NGO platform. Powers website settings, CMS pages &
policies, per-page SEO, authentication, and user management.

---

## 🧱 Tech stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **NestJS 11** (TypeScript) | Structured, modular, scalable API |
| Database | **PostgreSQL** | Reliable relational DB (free tiers: Supabase, Neon) |
| ORM | **Prisma** | Single `schema.prisma`, type-safe client, easy migrations + Studio |
| Auth | **JWT** (Passport) + **bcryptjs** | Stateless auth, hashed passwords |
| Validation | **class-validator / class-transformer** | DTO validation |
| Docs | **Swagger** | API docs at `/api/docs` (dev only) |
| Optional | **Redis** (cache), **AWS S3** (uploads), **Twilio** (OTP), **Nodemailer** (email) | All toggle-able, off by default |
| Package manager | **pnpm** | Fast, disk-efficient |

> Redis, AWS and Docker are **optional** — the app runs perfectly without them.

---

## ✅ Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (`corepack enable` then `corepack prepare pnpm@9.15.0 --activate`)
- **PostgreSQL** 14+ running locally, or Docker, or a managed DB (Supabase/Neon)

---

## 🚀 Getting started

```bash
# 1. Install dependencies (also runs `prisma generate`)
pnpm install

# 2. Configure environment
#    Edit .env.development — at minimum set DATABASE_URL
#    Prisma CLI reads DATABASE_URL from the root .env file

# 3a. (Option A) Start Postgres + the app with Docker
docker compose -f docker-compose.dev.yml up
#    Redis is optional — to include it:  docker compose --profile cache up

# 3b. (Option B) Run locally against your own Postgres
#     Make sure Postgres is running, then:

# 4. Create the database tables
pnpm prisma migrate dev --name init

# 5. Seed an admin user + default settings + sample CMS pages
pnpm db:seed
#    → Admin login:  admin@example.com / Admin@12345
#    (override with SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)

# 6. Start the dev server (http://localhost:8080)
pnpm start:dev
```

Swagger docs: **http://localhost:8080/api/docs** · Adminer (Docker): **http://localhost:8081**

---

## 📜 Scripts

| Script | Description |
|--------|-------------|
| `pnpm start:dev` | Dev server with watch |
| `pnpm build` / `pnpm start:prod` | Production build / run |
| `pnpm prisma:migrate` | Create & apply a migration (dev) |
| `pnpm prisma:deploy` | Apply migrations (production) |
| `pnpm prisma:studio` | Visual DB browser (Prisma Studio) |
| `pnpm db:seed` | Seed admin + settings + sample pages |
| `pnpm docker:dev` | Start full dev stack in Docker |
| `pnpm lint` / `pnpm test` | Lint / run tests |

---

## 🗂️ Project structure

```
prisma/
  schema.prisma         # User, Settings, CmsPage, SeoMeta, OtpVerification
  seed.ts               # Admin user + defaults
src/
  main.ts               # Bootstrap, global prefix /api, CORS, Swagger
  app.module.ts         # Root module wiring
  database/             # PrismaModule + PrismaService (global)
  common/               # Guards, interceptors, filters, decorators, DTOs, pipes
  config/               # Typed env config (app, jwt, redis, aws, etc.)
  modules/
    auth/emails/        # Email register/login/change-password (JWT)
    auth/otp/           # Phone OTP login (Twilio) — optional
    users/              # User CRUD + roles + profile picture
    settings/           # Website settings singleton (GET public, PATCH admin)
    cms/                # CMS pages & policies (CRUD, slug, publish)
    seo/                # Per-page SEO for coded pages (home/about/...)
    emails/             # Transactional email (optional)
    uploads/            # AWS S3 uploads (optional)
    health/             # Health checks (DB, Redis, disk)
```

---

## 🔌 Key API endpoints (prefix: `/api`)

**Auth**
- `POST /auth/register` · `POST /auth/login` · `POST /auth/change-password`

**Settings** (header/footer/SEO config)
- `GET /settings` — public · `PATCH /settings` — admin

**CMS pages**
- `GET /cms/pages` — admin (list, paginate/search/status)
- `GET /cms/pages/public` — public (published list, for sitemap)
- `GET /cms/pages/slug/:slug` — public (published page)
- `POST` · `PATCH /:id` · `PATCH /:id/publish` · `PATCH /:id/unpublish` · `DELETE /:id` — admin

**SEO manager** (per coded page)
- `GET /seo/:key` — public · `GET /seo` — admin · `PUT /seo/:key` — admin

**Users**
- `GET /users` — list · `PATCH /users/:id` — update (role/status) · `DELETE /users/:id` — admin

**Health**: `GET /health`

Roles: `user` (donor), `admin`, `super_admin`. Admin routes are protected by JWT + `RolesGuard`.

---

## ⚙️ Optional services

- **Redis** — caching. Off by default (`REDIS_ENABLED=false`). When disabled the cache layer is a safe no-op. Enable with `REDIS_ENABLED=true` + `docker compose --profile cache up`.
- **AWS S3** — file uploads. Off until `AWS_ENABLED=true` and credentials are set.
- **Twilio / Email** — for OTP and transactional email; configure the relevant env vars.

---

## 🐘 Switching databases

Set `DATABASE_URL` in `.env.development` / `.env.production` (and the root `.env`
for the Prisma CLI). Free managed Postgres: **Supabase**, **Neon** (add
`?sslmode=require`). After changing the schema run `pnpm prisma migrate dev`.

---

## 🔐 Notes

- `.env*` files hold secrets — they are git-ignored; never commit real values.
- This project uses **pnpm only**; other lockfiles are git-ignored.
- Production: set a strong `JWT_SECRET`, disable Swagger, use a managed Postgres.
