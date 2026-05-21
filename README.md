# AI Salon Platform

AI-платформа автоматизации для малого бизнеса (салоны красоты, барбершопы, фитнес, клиники, автосервисы).

## Структура

```
/
├── backend/        # Node.js + Express + Prisma + BullMQ
│   ├── src/
│   │   ├── api/          # Express роуты
│   │   ├── agents/       # AI агент (Claude Haiku)
│   │   ├── channels/     # Telegram, WhatsApp, SMS, MAX
│   │   ├── db/           # Prisma + Redis клиенты
│   │   ├── queues/       # BullMQ воркеры (напоминания)
│   │   ├── middleware/   # auth, rate-limit, errors
│   │   └── index.ts
│   └── prisma/schema.prisma
│
├── shared/
│   ├── types.ts          # Общие TS интерфейсы
│   └── niches.ts         # Конфиги ниш
│
└── README.md
```

## Стек

- **Node.js + TypeScript + Express** — API
- **PostgreSQL + Prisma** — БД
- **Redis + BullMQ** — очереди и кэш
- **Anthropic Claude Haiku 4.5** — AI-агент
- **Telegram / WhatsApp / SMS / MAX** — каскадная доставка сообщений
- **Railway** — деплой

## Быстрый старт

```bash
cd backend
cp .env.example .env       # заполни переменные
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Ключевые компоненты

- **MessageRouter** (`src/channels/messageRouter.ts`) — единая точка входа для сообщений из всех каналов.
- **AIAgent** (`src/agents/aiAgent.ts`) — обработка через Claude с prompt caching, детекция intent, создание записей.
- **CascadeSender** (`src/channels/cascadeSender.ts`) — отправка через каналы по приоритету с обходом блокировок.
- **ReminderWorker** (`src/queues/reminderWorker.ts`) — напоминания за 24ч и 2ч до записи.

## Эндпоинты

- `POST /webhook/telegram` — апдейты от Telegram
- `POST /webhook/whatsapp` — апдейты от WhatsApp
- `POST /api/salons` / `GET /api/salons/:id` / `PUT /api/salons/:id`
- `GET  /api/salons/:id/clients|appointments|messages|analytics`
- `POST /api/appointments` / `PUT /api/appointments/:id/status`
- `GET  /health`
