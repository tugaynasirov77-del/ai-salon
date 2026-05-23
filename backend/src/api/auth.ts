// Аутентификация: register, login, me.
// Регистрация создаёт User + Salon одной транзакцией.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db/prisma';
import { asyncHandler } from '../middleware/errors';
import { signToken, requireAuth } from '../middleware/auth';

const router = Router();
const BCRYPT_ROUNDS = 10;

// POST /api/auth/register — регистрация владельца + создание салона
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, salonName, ownerName, phone, niche, city, address } = req.body;
    if (!email || !password || !salonName || !ownerName || !phone || !niche) {
      res.status(400).json({ error: 'email, password, salonName, ownerName, phone, niche обязательны' });
      return;
    }
    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Пароль минимум 6 символов' });
      return;
    }
    const emailLower = String(email).trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailLower)) {
      res.status(400).json({ error: 'Некорректный email' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existing) {
      res.status(409).json({ error: 'Пользователь с таким email уже существует' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Создаём салон и юзера одной транзакцией
    const result = await prisma.$transaction(async (tx) => {
      const salon = await tx.salon.create({
        data: {
          name: salonName,
          ownerName,
          phone,
          niche,
          address: address || null,
          settings: city ? { city } : undefined,
        },
      });
      const user = await tx.user.create({
        data: {
          email: emailLower,
          passwordHash,
          name: ownerName,
          role: 'owner',
          salonId: salon.id,
        },
      });
      return { user, salon };
    });

    const token = signToken({
      userId: result.user.id,
      email: result.user.email,
      salonId: result.salon.id,
      role: result.user.role,
    });

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        salonId: result.salon.id,
      },
      salon: {
        id: result.salon.id,
        name: result.salon.name,
        niche: result.salon.niche,
      },
    });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'email, password обязательны' });
      return;
    }
    const emailLower = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: emailLower } });
    if (!user) {
      res.status(401).json({ error: 'Неверный email или пароль' });
      return;
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: 'Неверный email или пароль' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      salonId: user.salonId,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        salonId: user.salonId,
      },
    });
  })
);

// GET /api/auth/me — данные текущего юзера + его салон
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { salon: true },
    });
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        salonId: user.salonId,
        lastLoginAt: user.lastLoginAt,
      },
      salon: user.salon,
    });
  })
);

// POST /api/auth/change-password
router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'oldPassword, newPassword (мин. 6) обязательны' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ error: 'Не найден' });
      return;
    }
    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: 'Старый пароль неверный' });
      return;
    }
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.json({ ok: true });
  })
);

export default router;
