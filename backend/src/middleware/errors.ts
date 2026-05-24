import { Request, Response, NextFunction } from 'express';
import { alertError } from '../utils/alerter';

// Глобальный обработчик ошибок Express
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[error]', err?.stack || err);
  const status = err?.status || 500;
  // Алёрт только на 5xx (не на 4xx — это пользовательские ошибки)
  if (status >= 500) {
    alertError(
      `${req.method} ${req.path} → ${status}`,
      {
        error: err?.message,
        user: req.user?.email || null,
        salonId: req.user?.salonId || null,
        stack: (err?.stack || '').split('\n').slice(0, 6).join('\n'),
      },
      `http5xx:${req.method}:${req.route?.path || req.path}`
    ).catch(() => {});
  }
  res.status(status).json({
    error: err?.message || 'Internal server error',
  });
}

// Ловим unhandled rejections и uncaught exceptions
export function setupGlobalErrorHandlers(): void {
  process.on('unhandledRejection', (reason: any) => {
    console.error('[unhandledRejection]', reason);
    alertError(
      'Unhandled Rejection',
      { reason: String(reason).slice(0, 500), stack: reason?.stack?.split('\n').slice(0, 6).join('\n') },
      `unhandled:${String(reason).slice(0, 80)}`
    ).catch(() => {});
  });
  process.on('uncaughtException', (err: Error) => {
    console.error('[uncaughtException]', err);
    alertError(
      'Uncaught Exception',
      { message: err.message, stack: err.stack?.split('\n').slice(0, 8).join('\n') },
      `uncaught:${err.message.slice(0, 80)}`
    ).catch(() => {});
  });
}

// Обёртка для async-роутов
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
