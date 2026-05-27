import { config as loadEnv } from 'dotenv';
loadEnv({ override: true });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { apiLimiter, webhookLimiter } from './middleware/rateLimit';
import { errorHandler, setupGlobalErrorHandlers } from './middleware/errors';
import { metricsMiddleware, startMetricsCleanup } from './middleware/metrics';
import { alertInfo, alertError } from './utils/alerter';

import webhooksRouter from './api/webhooks';
import authRouter from './api/auth';
import salonsRouter from './api/salons';
import appointmentsRouter from './api/appointments';
import crmRouter from './api/crm';
import testChatRouter from './api/testChat';
import widgetRouter from './api/widget';
import leadsRouter from './api/leads';
import adminRouter from './api/admin';
import healthRouter from './api/health';
import { attachUser, requireAuth, requireSalonAccess } from './middleware/auth';
import path from 'path';

import { initAllSalonBots } from './channels/telegram';
import { initAllSalonBots as initAllMaxBots } from './channels/max';
import { initAllSalonBots as initAllAvitoBots } from './channels/avito';
import { startReminderWorker } from './queues/reminderWorker';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
// SMS-провайдеры (sms.ru/smsc) шлют callback в form-encoded
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// HTTP-метрики: latency / error rate / top ошибок (для /api/admin/metrics)
app.use(metricsMiddleware);

// JWT attach — кладёт req.user если есть валидный токен (не падает если нет)
app.use(attachUser);

// Webhook-роуты — с мягким rate-limit (без auth, внешние сервисы)
app.use('/webhook', webhookLimiter, webhooksRouter);

// Публичные API: auth (register/login) и widget (для виджета на сайтах салонов)
app.use('/api/auth', apiLimiter, authRouter);
app.use('/api/widget', apiLimiter, widgetRouter);
app.use('/api/leads', apiLimiter, leadsRouter);
app.use('/api/admin', apiLimiter, adminRouter);

// Защищённые API: требуют JWT, и доступ к salonId в URL должен совпадать с user.salonId
app.use('/api/salons/:id', apiLimiter, requireAuth, requireSalonAccess);
app.use('/api/salons', apiLimiter, salonsRouter);
app.use('/api/salons', apiLimiter, crmRouter);
app.use('/api/salons', apiLimiter, testChatRouter);
app.use('/api/appointments', apiLimiter, requireAuth, appointmentsRouter);

// Статика для widget.js и демо-страницы (на любом домене салона можно подключить)
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '5m' }));

// Health-чек без лимита
app.use('/health', healthRouter);

// Глобальный обработчик ошибок (последний)
app.use(errorHandler);

setupGlobalErrorHandlers();

app.listen(PORT, () => {
  console.log(`[server] запущен на порту ${PORT}`);
  alertInfo('Backend стартовал', { port: PORT, env: process.env.NODE_ENV || 'dev' }, 'startup').catch(() => {});

  // Инициализируем интеграции — поднимаем webhook'и всех салонов с подключённым ботом
  initAllSalonBots().catch((e) => {
    console.error('[startup] telegram init error:', e);
    alertError('Telegram init failed', String(e), 'tg-init');
  });
  initAllMaxBots().catch((e) => {
    console.error('[startup] max init error:', e);
    alertError('Max init failed', String(e), 'max-init');
  });
  initAllAvitoBots().catch((e) => {
    console.error('[startup] avito init error:', e);
    alertError('Avito init failed', String(e), 'avito-init');
  });

  startMetricsCleanup();

  try {
    startReminderWorker();
    console.log('[server] reminder worker запущен');
  } catch (e) {
    console.error('[startup] reminder worker error:', e);
    alertError('Reminder worker failed to start', String(e), 'reminder-start');
  }
});
