'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowRight, CheckCircle2, AlertTriangle, Eye, EyeOff,
} from 'lucide-react';
import { apiResetPassword } from '@/lib/auth';

const inputCls =
  'h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30';
const labelCls = 'mb-1 block text-xs font-medium uppercase tracking-wider text-slate-400';

const MIN_PASSWORD = 6;

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Нет токена в URL — показываем экран с ошибкой и ссылкой запросить новый
  if (!token) {
    return (
      <div>
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 ring-1 ring-amber-400/30">
          <AlertTriangle className="h-7 w-7 text-amber-300" />
        </div>
        <h1 className="text-center text-2xl font-semibold text-white">Ссылка недействительна</h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm text-slate-400">
          В ссылке отсутствует токен. Возможно, она была обрезана при копировании или истёк срок действия (1 час).
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#3B82F6] to-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]"
        >
          Запросить новую ссылку
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div>
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30">
          <CheckCircle2 className="h-7 w-7 text-emerald-300" />
        </div>
        <h1 className="text-center text-2xl font-semibold text-white">Пароль изменён</h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm text-slate-400">
          Теперь войдите с новым паролем.
        </p>
        <button
          type="button"
          onClick={() => router.replace('/login')}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#3B82F6] to-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]"
        >
          Войти
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD) {
      setError(`Пароль должен быть не короче ${MIN_PASSWORD} символов`);
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setSubmitting(true);
    try {
      await apiResetPassword(token, password);
      setSuccess(true);
    } catch (e: any) {
      const msg = e?.message || 'Не удалось установить пароль';
      // Бэк возвращает понятные сообщения для протухших/недействительных токенов
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Новый пароль</h1>
      <p className="mt-1 text-sm text-slate-400">
        Минимум {MIN_PASSWORD} символов. Используйте уникальный пароль, который не используете на других сайтах.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="password" className={labelCls}>Новый пароль</label>
          <div className="relative">
            <input
              id="password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={'не короче ' + MIN_PASSWORD + ' символов'}
              className={inputCls + ' pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? 'Скрыть пароль' : 'Показать пароль'}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className={labelCls}>Повторите пароль</label>
          <input
            id="confirm"
            type={showPwd ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting || !password || !confirm}
          className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#3B82F6] to-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Установить пароль
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-400">
        Вспомнили старый?{' '}
        <Link href="/login" className="font-medium text-amber-300 hover:text-white">
          Войти
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Загрузка…</div>}>
      <ResetForm />
    </Suspense>
  );
}
