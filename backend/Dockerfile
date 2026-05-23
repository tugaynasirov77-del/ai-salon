# Стейдж 1 — сборка
FROM node:20-alpine AS builder
WORKDIR /app

# OpenSSL для корректной детекции Prisma engine
RUN apk add --no-cache openssl

# Копируем манифесты и ставим зависимости.
# Зеркало npmmirror используется как основное (registry.npmjs.org нестабилен из РФ),
# но если ci упал на нём (новый пакет ещё не реплицировался) — fallback на npmjs + retries.
COPY backend/package*.json ./
RUN npm config set registry https://registry.npmmirror.com \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && (npm ci --no-audit --no-fund \
     || (echo '[build] npmmirror не сработал, fallback на npmjs.org'; \
         npm config set registry https://registry.npmjs.org \
         && npm ci --no-audit --no-fund))

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
