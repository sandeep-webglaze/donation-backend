# ============================================
# Base — enable pnpm via corepack
# ============================================
FROM node:21.5.0-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# ============================================
# DEVELOPMENT STAGE
# ============================================
FROM base AS development
RUN apk add --no-cache dumb-init
WORKDIR /usr/src/app

# Copy manifests + prisma schema first (postinstall runs `prisma generate`)
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma

# Install dependencies with pnpm
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code
COPY . .

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["pnpm", "run", "start:dev"]


# ============================================
# BUILD STAGE
# ============================================
FROM base AS build
WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile || pnpm install

COPY . .

# Generate Prisma client + build, then drop dev dependencies
RUN pnpm run build
RUN pnpm prune --prod


# ============================================
# PRODUCTION STAGE
# ============================================
FROM node:21.5.0-alpine AS production
RUN apk add --no-cache dumb-init

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /usr/src/app

# Copy pruned production deps (incl. generated Prisma client), build output, manifests
COPY --from=build --chown=nestjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /usr/src/app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /usr/src/app/prisma ./prisma
COPY --from=build --chown=nestjs:nodejs /usr/src/app/package.json ./package.json

USER nestjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
