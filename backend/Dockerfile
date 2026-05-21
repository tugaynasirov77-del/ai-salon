# Стейдж 1 — сборка
FROM node:20-alpine AS builder
WORKDIR /app

# Зеркало npm — registry.npmjs.org нестабилен из РФ
RUN npm config set registry https://registry.npmmirror.com

# Копируем манифесты и ставим зависимости
COPY backend/package*.json ./
RUN npm ci

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
