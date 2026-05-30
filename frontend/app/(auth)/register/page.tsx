'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight } from 'lucide-react';
import { NICHES } from '@shared/niches';
import type { NicheKey } from '@shared/types';
import { apiRegister, useAuthStore } from '@/lib/auth';
import { formatPhone } from '@/lib/utils';
import { track } from '@/lib/analytics';

const NICHE_ORDER: NicheKey[] = [
  'beauty_salon', 'barbershop', 'fitness', 'clinic', 'auto_service',
  'restaurant', 'lawyer', 'tutor', 'other',
];

const inputCls =
  'h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30';

const labelCls = 'mb-1 block text-xs font-medium uppercase tracking-wider text-slate-400';

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({
    email: '',
    password: '',
    salonName: '',
    ownerName: '',
    phone: '',
    niche: 'beauty_salon' as NicheKey,
    city: '',
    address: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function upd<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) {
      setError('Пароль не короче 8 символов');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRegister({
        email: form.email.trim(),
        password: form.password,
        salonName: form.salonName.trim(),
        ownerName: form.ownerName.trim(),
        phone: form.phone,
        niche: form.niche,
        city: form.city || undefined,
        address: form.address || undefined,
      });
      setSession({ user: res.user, salon: res.salon });
      track('register_completed', {
        niche: form.niche,
        has_phone: !!form.phone?.trim(),
        has_address: !!form.address?.trim(),
      });
      router.replace('/dashboard/onboarding');
    } catch (e: any) {
      setError(e?.message || 'Не удалось зарегистрироваться');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Регистрация</h1>
      <p className="mt-1 text-sm text-slate-400">Зарегистрируйте салон и получите доступ к админке.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="email" label="Email" required>
            <input id="email" type="email" autoComplete="email" required value={form.email}
              onChange={(e) => upd('email', e.target.value)} placeholder="vy@salon.ru" className={inputCls} />
          </Field>
          <Field id="password" label="Пароль" required>
            <input id="password" type="password" autoComplete="new-password" required minLength={8}
              value={form.password} onChange={(e) => upd('password', e.target.value)} placeholder="не менее 8 символов" className={inputCls} />
          </Field>
          <Field id="salonName" label="Название салона" required>
            <input id="salonName" required value={form.salonName}
              onChange={(e) => upd('salonName', e.target.value)} placeholder='"Студия Грация"' className={inputCls} />
          </Field>
          <Field id="ownerName" label="Имя владельца" required>
            <input id="ownerName" required value={form.ownerName}
              onChange={(e) => upd('ownerName', e.target.value)} placeholder="Иван Петров" className={inputCls} />
          </Field>
          <Field id="phone" label="Телефон" required>
            <input id="phone" required value={form.phone}
              onChange={(e) => upd('phone', formatPhone(e.target.value))} placeholder="+7 (___) ___-__-__" className={inputCls} />
          </Field>
          <Field id="niche" label="Ниша" required>
            <select id="niche" required value={form.niche}
              onChange={(e) => upd('niche', e.target.value as NicheKey)} className={inputCls + ' px-2'}>
              {NICHE_ORDER.map((k) => (
                <option key={k} value={k} className="bg-[#181B22] text-white">
                  {NICHES[k].icon} {NICHES[k].label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="city" label="Город">
            <input id="city" value={form.city} onChange={(e) => upd('city', e.target.value)} placeholder="Москва" className={inputCls} />
          </Field>
          <Field id="address" label="Адрес">
            <input id="address" value={form.address} onChange={(e) => upd('address', e.target.value)} placeholder="ул. Тверская, 1" className={inputCls} />
          </Field>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#3B82F6] to-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Создать аккаунт
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-400">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="font-medium text-amber-300 hover:text-white">Войти</Link>
      </p>
    </div>
  );
}

function Field({ id, label, required, children }: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}{required && <span className="text-red-400"> *</span>}
      </label>
      {children}
    </div>
  );
}
