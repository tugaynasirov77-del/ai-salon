'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowRight, CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import { apiForgotPassword } from '@/lib/auth';

const inputCls =
  'h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30';
const labelCls = 'mb-1 block text-xs font-medium uppercase tracking-wider text-slate-400';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiForgotPassword(email.trim());
      setSent(true);
    } catch (e: any) {
      // Бэк всегда возвращает 200 — сюда попадаем только при сетевой проблеме
      setError(e?.message || 'Не удалось отправить письмо. Проверьте интернет.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div>
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30">
          <CheckCircle2 className="h-7 w-7 text-emerald-300" />
        </div>
        <h1 className="text-center text-2xl font-semibold text-white">Письмо отправлено</h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm text-slate-400">
          Если аккаунт с этим email существует — мы отправили на него ссылку для восстановления пароля.
          Проверьте папку «Спам», если письма нет во входящих.
        </p>
        <p className="mx-auto mt-4 max-w-sm text-center text-xs text-slate-500">
          Ссылка действует <span className="font-medium text-slate-300">1 час</span>.
        </p>

        <div className="mt-8 space-y-2">
          <button
            type="button"
            onClick={() => { setSent(false); setEmail(''); }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.08]"
          >
            <Mail className="h-4 w-4" />
            Отправить ещё раз
          </button>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 px-6 py-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Вернуться к входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Восстановление пароля</h1>
      <p className="mt-1 text-sm text-slate-400">
        Введите email — пришлём ссылку для сброса пароля.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className={labelCls}>Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@ailiva.ru"
            className={inputCls}
          />
        </div>
        {error && (
          <div className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>
        )}
        <button
          type="submit"
          disabled={submitting || !email.trim()}
          className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#3B82F6] to-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Отправить ссылку
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-400">
        Вспомнили пароль?{' '}
        <Link href="/login" className="font-medium text-amber-300 hover:text-white">
          Войти
        </Link>
      </p>
    </div>
  );
}
