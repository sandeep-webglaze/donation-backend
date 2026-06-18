# 🛠️ Setup Guide — Donation Platform (Naye system pe setup karne ke liye)

Yeh guide batati hai ki agar aap project ko **kisi naye computer** pe setup karein
to step-by-step kya-kya karna hai. Do folders hain:

- `donation-backend` → API (NestJS + Prisma + PostgreSQL)
- `donation-frontend` → Website + Admin panel (Next.js)

> Is project me **sirf pnpm** use hota hai (npm/yarn nahi).

---

## 0. Prerequisites (ek baar install karo)

| Tool | Version | Link |
|------|---------|------|
| **Node.js** | 20 ya 22 LTS | https://nodejs.org |
| **pnpm** | 9+ | neeche dekho |
| **PostgreSQL** | 14+ | https://www.postgresql.org/download/ (ya Docker) |
| **Git** | latest | https://git-scm.com |

pnpm enable karo (Node ke saath aata hai):
```powershell
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm -v   # version dikhe to ho gaya
```

---

## 1. Code lao

Dono folders naye system pe copy karo (USB/zip/Git). Maan lo path hai:
`D:\Web App\Donation\donation-backend` aur `...\donation-frontend`.

> **node_modules copy mat karna** — har system pe `pnpm install` se fresh banega.

---

## 2. PostgreSQL ready karo

**Option A — Local Postgres install** (recommended for beginners)
1. Postgres install karte time ek password set hota hai (yaad rakho).
2. Ek database banao, naam `nestjs_db`. (pgAdmin se ya command se)
3. Connection string banegi:
   `postgresql://postgres:YOUR_PASSWORD@localhost:5432/nestjs_db?schema=public`

**Option B — Docker** (Postgres install kiye bina)
```powershell
cd donation-backend
docker compose -f docker-compose.dev.yml up
```
Yeh Postgres + app dono chalu kar dega (default password `postgres`).

**Option C — Free cloud Postgres** (Supabase / Neon) — unka connection string lo
(`?sslmode=require` add karna).

---

## 3. Backend setup (`donation-backend`)

```powershell
cd donation-backend

# 3.1 — Dependencies install
pnpm install

# 3.2 — Environment: .env.development me DATABASE_URL set karo
#       aur root .env me bhi (Prisma CLI usse padhta hai)
#       Example:
#       DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/nestjs_db?schema=public"

# 3.3 — Database tables banao
pnpm prisma migrate dev --name init

# 3.4 — Admin user + default settings + sample pages banao
pnpm db:seed

# 3.5 — Server chalao
pnpm start:dev
```

✅ Backend chalu: **http://localhost:8080**
- API docs (Swagger): http://localhost:8080/api/docs
- Visual DB browser: `pnpm prisma:studio`

---

## 4. Frontend setup (`donation-frontend`)

```powershell
cd donation-frontend

# 4.1 — Dependencies
pnpm install

# 4.2 — Environment: backend ka URL batao
copy .env.example .env.local
#   .env.local me yeh hone chahiye:
#   NEXT_PUBLIC_API_URL=http://localhost:8080/api
#   NEXT_PUBLIC_SITE_URL=http://localhost:3000
#   API_URL=http://localhost:8080/api

# 4.3 — Chalao (backend pehle se chalu hona chahiye)
pnpm dev
```

✅ Website: **http://localhost:3000**
✅ Admin: **http://localhost:3000/admin** (login: **/login**)

---

## 5. Admin login

Seed (`pnpm db:seed`) ye default admin banata hai:

| | |
|---|---|
| **Email** | `admin@local.com` |
| **Password** | `Admin@12345` |

---

## 6. Admin email / password CHANGE karna

**Tareeka 1 — Seed se pehle apni values do (sabse aasan)** — PowerShell:
```powershell
cd donation-backend
$env:SEED_ADMIN_EMAIL="you@domain.com"
$env:SEED_ADMIN_PASSWORD="YourPass@123"
pnpm db:seed
```

**Tareeka 2 — Seed file me default badlo**
`prisma/seed.ts` kholo, yeh line edit karo:
```ts
const email = process.env.SEED_ADMIN_EMAIL || 'admin@local.com';   // <- yahan change
const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345'; // <- yahan change
```
phir `pnpm db:seed`.

**Tareeka 3 — Email change via Prisma Studio**
```powershell
pnpm prisma:studio
```
→ `users` table → admin row → `email` edit → save.
(Password hashed hota hai isliye Studio se password change mat karna — Tareeka 1/2 use karo.)

> Note: Admin panel → Users se abhi **role** aur **active/inactive** change hota hai,
> email/password nahi. Email/password ke liye upar wale tareeke use karo.

---

## 7. Common errors & fixes (Windows)

**`'NODE_ENV' is not recognized`**
→ `pnpm install` dobara chalao (`cross-env` install ho jaayega), phir `pnpm start:dev`.

**`ERR_PNPM_EBUSY` (resource busy/locked)** install ke time
→ VS Code band karo · Task Manager me `node.exe` end karo · Windows Defender me
project folder ko **exclusion** me daalo · `node_modules` delete karke `pnpm install`.
→ Phir bhi aaye: terminal **Administrator** me chalao, ya `pnpm config set node-linker hoisted` phir `pnpm install`.

**Database connection error**
→ Postgres chalu hai? · `DATABASE_URL` (host/password/db naam) sahi hai? · Port 5432 free hai?

**Port already in use (8080 / 3000)**
→ Purana process band karo, ya `.env` me PORT badlo.

**`yarn` mat chalao** — project pnpm pe locked hai; `pnpm` hi use karo.

---

## 8. Optional features (zaroorat pe hi)

- **Redis (cache)** — default OFF. On karne ke liye `.env` me `REDIS_ENABLED=true`,
  aur `docker compose --profile cache up`.
- **AWS S3 (uploads)** — default OFF. `AWS_ENABLED=true` + real AWS keys daalo.
- **Email / OTP (Twilio)** — relevant env vars set karo tabhi kaam karenge.

---

## 9. Daily commands (roz ke liye)

**Backend** (`donation-backend`):
```powershell
pnpm start:dev            # dev server
pnpm prisma:studio        # DB dekhne ke liye
pnpm prisma migrate dev   # schema change ke baad
pnpm db:seed              # default data dobara
```

**Frontend** (`donation-frontend`):
```powershell
pnpm dev                  # dev server
pnpm build                # production build
```

---

## 10. Quick checklist (naye system pe)

- [ ] Node + pnpm + PostgreSQL installed
- [ ] Dono folders copy kiye (node_modules ke bina)
- [ ] Postgres me `nestjs_db` bana + `DATABASE_URL` set (backend `.env.development` + root `.env`)
- [ ] `donation-backend`: `pnpm install` → `pnpm prisma migrate dev` → `pnpm db:seed` → `pnpm start:dev`
- [ ] `donation-frontend`: `pnpm install` → `.env.local` set → `pnpm dev`
- [ ] Login: http://localhost:3000/login → `admin@local.com` / `Admin@12345`

Bas! Setup complete. 🎉
cd "D:\Web App\Donation\donation-backend"

# 1. node_modules fix (rename ne symlinks tode)
pnpm install

# 2. Postgres — purana container hata ke fresh chalao (data volume safe)
docker rm -f postgres-dev
docker compose -f docker-compose.dev.yml up -d postgres

# 3. Prisma client + tables + seed
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm db:seed

# 4. Backend chalao
pnpm start:dev