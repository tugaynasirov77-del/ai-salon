'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NICHES } from '@shared/niches';
import type { NicheKey } from '@shared/types';
import { apiRegister, useAuthStore } from '@/lib/auth';
import { formatPhone } from '@/lib/utils';

const NICHE_ORDER: NicheKey[] = [
  'beauty_salon', 'barbershop', 'fitness', 'clinic', 'auto_service',
  'restaurant', 'lawyer', 'tutor', 'other',
];

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
      router.replace('/dashboard');
    } catch (e: any) {
      setError(e?.message || 'Не удалось зарегистрироваться');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Регистрация</h1>
        <p className="mt-1 text-sm text-slate-500">Зарегистрируйте салон и получите доступ к админке.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input id="email" type="email" autoComplete="email" required value={form.email}
                onChange={(e) => upd('email', e.target.value)} placeholder="vy@salon.ru" />
            </div>
            <div>
              <Label htmlFor="password">Пароль <span className="text-red-500">*</span></Label>
              <Input id="password" type="password" autoComplete="new-password" required minLength={8}
                value={form.password} onChange={(e) => upd('password', e.target.value)} placeholder="не менее 8 символов" />
            </div>
            <div>
              <Label htmlFor="salonName">Название салона <span className="text-red-500">*</span></Label>
              <Input id="salonName" required value={form.salonName}
                onChange={(e) => upd('salonName', e.target.value)} placeholder='"Студия Грация"' />
            </div>
            <div>
              <Label htmlFor="ownerName">Имя владельца <span className="text-red-500">*</span></Label>
              <Input id="ownerName" required value={form.ownerName}
                onChange={(e) => upd('ownerName', e.target.value)} placeholder="Иван Петров" />
            </div>
            <div>
              <Label htmlFor="phone">Телефон <span className="text-red-500">*</span></Label>
              <Input id="phone" required value={form.phone}
                onChange={(e) => upd('phone', formatPhone(e.target.value))} placeholder="+7 (___) ___-__-__" />
            </div>
            <div>
              <Label htmlFor="niche">Ниша <span className="text-red-500">*</span></Label>
              <select
                id="niche"
                required
                value={form.niche}
                onChange={(e) => upd('niche', e.target.value as NicheKey)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                {NICHE_ORDER.map((k) => (
                  <option key={k} value={k}>
                    {NICHES[k].icon} {NICHES[k].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="city">Город</Label>
              <Input id="city" value={form.city} onChange={(e) => upd('city', e.target.value)} placeholder="Москва" />
            </div>
            <div>
              <Label htmlFor="address">Адрес</Label>
              <Input id="address" value={form.address} onChange={(e) => upd('address', e.target.value)} placeholder="ул. Тверская, 1" />
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Создать аккаунт
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Войти
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
