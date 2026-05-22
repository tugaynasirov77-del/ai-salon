import { config as loadEnv } from 'dotenv';
loadEnv({ override: true });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { apiLimiter, webhookLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errors';

import webhooksRouter from './api/webhooks';
import salonsRouter from './api/salons';
import appointmentsRouter from './api/appointments';
import crmRouter from './api/crm';
import testChatRouter from './api/testChat';
import healthRouter from './api/health';

import { initAllSalonBots } from './channels/telegram';
import { startReminderWorker } from './queues/reminderWorker';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Webhook-роуты — с мягким rate-limit (без auth, внешние сервисы)
app.use('/webhook', webhookLimiter, webhooksRouter);

// API-роуты — со строгим лимитом
app.use('/api/salons', apiLimiter, salonsRouter);
app.use('/api/salons', apiLimiter, crmRouter);
app.use('/api/salons', apiLimiter, testChatRouter);
app.use('/api/appointments', apiLimiter, appointmentsRouter);

// Health-чек без лимита
app.use('/health', healthRouter);

// Глобальный обработчик ошибок (последний)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server] запущен на порту ${PORT}`);

  // Инициализируем интеграции — поднимаем webhook'и всех салонов с подключённым ботом
  initAllSalonBots().catch((e) => console.error('[startup] telegram init error:', e));

  try {
    startReminderWorker();
    console.log('[server] reminder worker запущен');
  } catch (e) {
    console.error('[startup] reminder worker error:', e);
  }
});
