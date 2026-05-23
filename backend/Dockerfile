# Стейдж 1 — сборка
FROM node:20-alpine AS builder
WORKDIR /app

# OpenSSL для корректной детекции Prisma engine
RUN apk add --no-cache openssl

# Копируем манифесты и ставим зависимости.
# npmjs.org как основной (через IPv6 работает из РФ), npmmirror как fallback —
# раньше npmjs был нестабилен, теперь наоборот зеркало может отдавать 502 на новых пакетах.
COPY backend/package*.json ./
RUN npm config set fetch-retries 3 \
 && npm config set fetch-retry-mintimeout 15000 \
 && npm config set fetch-retry-maxtimeout 60000 \
 && (npm ci --registry=https://registry.npmjs.org --no-audit --no-fund \
     || (echo '[build] npmjs.org не сработал, fallback на npmmirror'; \
         npm ci --registry=https://registry.npmmirror.com --no-audit --no-fund))

# Копируем исходники бэка и shared
COPY backend/ ./
COPY shared /shared

# Генерируем Prisma Client
RUN npx prisma generate

# Стейдж 2 — runtime
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app /app
COPY --from=builder /shared /shared

ENV NODE_ENV=production
EXPOSE 3000

# При старте: применяем миграции и стартуем
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/index.ts"]
