import { Request, Response, NextFunction } from 'express';

// Глобальный обработчик ошибок Express
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[error]', err?.stack || err);
  const status = err?.status || 500;
  res.status(status).json({
    error: err?.message || 'Internal server error',
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
