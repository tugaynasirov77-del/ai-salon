// Универсальная SMTP-обёртка через nodemailer.
// Работает с любым провайдером — Yandex.Mail (РФ), SendPulse, SMTP.ru, Mail.ru, Gmail и т.д.
//
// ENV:
//   SMTP_HOST       — например smtp.yandex.ru
//   SMTP_PORT       — 465 (SSL) или 587 (STARTTLS)
//   SMTP_USER       — login (обычно email отправителя)
//   SMTP_PASS       — пароль приложения
//   SMTP_FROM       — From-адрес ("Liva AI <noreply@ailiva.ru>")
//   FRONTEND_URL    — база ссылок для писем (https://ailiva.ru)
//
// Если SMTP_HOST не задан — sendEmail логирует в консоль и возвращает true (dev-режим).
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;
let initFailed = false;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  if (initFailed) return null;
  const host = process.env.SMTP_HOST;
  if (!host) {
    initFailed = true;
    return null;
  }
  const port = Number(process.env.SMTP_PORT) || 465;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465=SSL, остальные через STARTTLS
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
  return transporter;
}

export type SendEmailOpts = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(opts: SendEmailOpts): Promise<boolean> {
  const t = getTransporter();
  const from = process.env.SMTP_FROM || 'Liva AI <noreply@ailiva.ru>';
  if (!t) {
    // Dev/fallback: лог в консоль чтобы можно было локально проверить ссылку
    console.log(`[mailer:DRY] to=${opts.to} subject="${opts.subject}"\n${opts.text || opts.html}`);
    return true;
  }
  try {
    await t.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text || stripHtml(opts.html),
    });
    return true;
  } catch (e: any) {
    console.error(`[mailer] ошибка отправки на ${opts.to}:`, e?.message);
    return false;
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// ───── Готовые шаблоны ─────

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  userName?: string | null
): Promise<boolean> {
  const greeting = userName ? `, ${userName}` : '';
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:540px;margin:0 auto;padding:24px;color:#1f2937;">
      <h2 style="color:#111827;margin:0 0 12px;font-size:20px;">Сброс пароля Liva AI</h2>
      <p>Привет${greeting}! Кто-то (надеемся, вы) запросил сброс пароля для аккаунта <b>${to}</b>.</p>
      <p>Чтобы задать новый пароль, перейдите по ссылке (действует 1 час):</p>
      <p style="margin:24px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">
          Сбросить пароль
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px;">Или скопируйте ссылку: <br><code style="word-break:break-all;">${resetUrl}</code></p>
      <p style="color:#6b7280;font-size:13px;margin-top:24px;">
        Если вы не запрашивали сброс — просто проигнорируйте это письмо, ваш пароль не изменится.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="color:#9ca3af;font-size:12px;">Liva AI · ailiva.ru</p>
    </div>
  `;
  return sendEmail({ to, subject: 'Сброс пароля Liva AI', html });
}

export async function sendWelcomeEmail(
  to: string,
  userName: string | null | undefined,
  salonName: string
): Promise<boolean> {
  const greeting = userName ? `, ${userName}` : '';
  const dashboardUrl = (process.env.FRONTEND_URL || 'https://ailiva.ru') + '/dashboard';
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:540px;margin:0 auto;padding:24px;color:#1f2937;">
      <h2 style="color:#111827;margin:0 0 12px;font-size:20px;">Добро пожаловать в Liva AI${greeting}!</h2>
      <p>Аккаунт для салона <b>${salonName}</b> создан. Что дальше:</p>
      <ol style="padding-left:20px;line-height:1.7;">
        <li>Заполните услуги и расписание в дашборде</li>
        <li>Подключите Telegram-бота или Авито</li>
        <li>Попробуйте тест-чат — AI ответит как реальному клиенту</li>
      </ol>
      <p style="margin:24px 0;">
        <a href="${dashboardUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">
          Открыть дашборд
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px;margin-top:24px;">
        Если возникли вопросы — просто ответьте на это письмо, мы поможем.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="color:#9ca3af;font-size:12px;">Liva AI · ailiva.ru</p>
    </div>
  `;
  return sendEmail({ to, subject: `Liva AI — добро пожаловать, ${salonName}!`, html });
}
