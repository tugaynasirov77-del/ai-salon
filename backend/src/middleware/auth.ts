import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES_IN = '30d';

export type JwtPayload = {
  userId: string;
  email: string;
  salonId: string | null;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// Извлекает JWT из Authorization: Bearer, кладёт в req.user. Не падает если токена нет.
export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const payload = verifyToken(token);
    if (payload) req.user = payload;
  }
  next();
}

// Требует валидный JWT.
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Требуется авторизация' });
    return;
  }
  next();
}

// Требует чтобы у юзера был salonId и он совпадал с :id в URL (защита от чужих салонов).
export function requireSalonAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Требуется авторизация' });
    return;
  }
  const salonIdInUrl = req.params.id || req.params.salonId;
  if (!salonIdInUrl) {
    res.status(400).json({ error: 'salonId не указан в URL' });
    return;
  }
  if (req.user.salonId !== salonIdInUrl) {
    res.status(403).json({ error: 'Нет доступа к этому салону' });
    return;
  }
  next();
}

// Хелпер: дёрнуть свежие данные юзера из БД (после регистрации/смены роли)
export async function loadUser(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}
