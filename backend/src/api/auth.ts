// Аутентификация: register, login, me.
// Регистрация создаёт User + Salon одной транзакцией.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../db/prisma';
import { asyncHandler } from '../middleware/errors';
import { signToken, requireAuth } from '../middleware/auth';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/mailer';

const router = Router();
const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 час

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

    // Welcome-email — async, не блокирует ответ
    sendWelcomeEmail(result.user.email, result.user.name, result.salon.name).catch((e) =>
      console.error('[auth.register] welcome email error:', e?.message)
    );

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

// POST /api/auth/forgot-password — генерируем токен, шлём ссылку на email
// Всегда отвечаем 200 (не палим какие email зарегистрированы)
router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'email обязателен' });
      return;
    }
    const emailLower = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: emailLower } });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
      });
      const baseUrl = process.env.FRONTEND_URL || 'https://ailiva.ru';
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;
      sendPasswordResetEmail(user.email, resetUrl, user.name).catch((e) =>
        console.error('[auth.forgot] mail error:', e?.message)
      );
    }
    res.json({ ok: true, message: 'Если email зарегистрирован — мы отправили ссылку для сброса.' });
  })
);

// POST /api/auth/reset-password — проверяем токен, ставим новый пароль
router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400).json({ error: 'token и newPassword (мин. 6 символов) обязательны' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { passwordResetToken: String(token) } });
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      res.status(400).json({ error: 'Ссылка недействительна или истекла. Запросите новую.' });
      return;
    }
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });
    res.json({ ok: true });
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
