'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight } from 'lucide-react';
import { apiLogin, apiMe, useAuthStore } from '@/lib/auth';

const inputCls =
  'h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30';
const labelCls = 'mb-1 block text-xs font-medium uppercase tracking-wider text-slate-400';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiLogin(email.trim(), password);
      const me = await apiMe();
      setSession(me);
      const next = params.get('next') || '/dashboard';
      router.replace(next);
    } catch (e: any) {
      setError(e?.message || 'Неверный email или пароль');
    } finally {
      setSubmitting(false);
    }
  }

  return (
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
      <div>
        <label htmlFor="password" className={labelCls}>Пароль</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
      </div>
      {error && (
        <div className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Войти
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Вход</h1>
      <p className="mt-1 text-sm text-slate-400">Войдите в админку Liva ai.</p>

      <Suspense fallback={<div className="mt-6 text-sm text-slate-500">Загрузка…</div>}>
        <LoginForm />
      </Suspense>

      <p className="mt-5 text-center text-sm text-slate-400">
        Нет аккаунта?{' '}
        <Link href="/register" className="font-medium text-violet-300 hover:text-white">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
