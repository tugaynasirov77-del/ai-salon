'use client';

import { useEffect, useState } from 'react';
import { Loader2, Check, AlertTriangle, User, Lock } from 'lucide-react';
import { NICHES } from '@shared/niches';
import type { NicheKey } from '@shared/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuthStore, apiChangePassword, apiMe } from '@/lib/auth';
import { updateSalon } from '@/lib/api';
import { formatPhone } from '@/lib/utils';

const inputCls =
  'h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30';
const labelCls = 'mb-1 block text-xs font-medium uppercase tracking-wider text-slate-400';

export default function ProfilePage() {
  const { user, salon, setSession } = useAuthStore();
  const [form, setForm] = useState({
    salonName: '',
    ownerName: '',
    phone: '',
    niche: 'beauty_salon' as NicheKey,
    city: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!salon) return;
    setForm({
      salonName: salon.name || '',
      ownerName: salon.ownerName || '',
      phone: salon.phone || '',
      niche: (salon.niche as NicheKey) || 'beauty_salon',
      city: salon.city || '',
      address: salon.address || '',
    });
  }, [salon]);

  async function save() {
    if (!salon) return;
    setSaving(true);
    setFeedback(null);
    try {
      await updateSalon(salon.id, {
        name: form.salonName.trim(),
        ownerName: form.ownerName.trim(),
        phone: form.phone,
        niche: form.niche,
        city: form.city.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      // Перечитаем сессию, чтобы sidebar/header показывал актуальные данные.
      const fresh = await apiMe();
      setSession(fresh);
      setFeedback({ kind: 'ok', text: 'Профиль сохранён' });
    } catch (e: any) {
      setFeedback({ kind: 'err', text: e?.message || 'Не удалось сохранить' });
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Профиль" description="Данные владельца и салона." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* === Профиль === */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 backdrop-blur-sm sm:p-7">
          <Head icon={<User className="h-5 w-5" />} title="О вас и салоне" />

          <div className="mt-5 space-y-4">
            <Field label="Email (изменить нельзя)">
              <input value={user.email} readOnly disabled className={inputCls + ' opacity-60'} />
            </Field>

            <Field label="Название салона">
              <input
                value={form.salonName}
                onChange={(e) => setForm((f) => ({ ...f, salonName: e.target.value }))}
                placeholder='"Студия Грация"'
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Имя владельца">
                <input
                  value={form.ownerName}
                  onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Телефон">
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
                  placeholder="+7 (___) ___-__-__"
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Ниша">
                <select
                  value={form.niche}
                  onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value as NicheKey }))}
                  className={inputCls + ' px-2'}
                >
                  {Object.values(NICHES).map((n: any) => (
                    <option key={n.key} value={n.key} className="bg-slate-900 text-white">
                      {n.icon} {n.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Город">
                <input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Адрес">
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="ул. Тверская, 1"
                className={inputCls}
              />
            </Field>

            {feedback && (
              <Feedback kind={feedback.kind} text={feedback.text} />
            )}

            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#3B82F6] to-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.4)] transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Сохранить профиль
            </button>
          </div>
        </section>

        {/* === Безопасность === */}
        <ChangePasswordCard />
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function submit() {
    setFeedback(null);
    if (!oldPw || !newPw) {
      setFeedback({ kind: 'err', text: 'Заполните оба поля' });
      return;
    }
    if (newPw.length < 8) {
      setFeedback({ kind: 'err', text: 'Новый пароль не короче 8 символов' });
      return;
    }
    if (newPw !== confirm) {
      setFeedback({ kind: 'err', text: 'Подтверждение не совпадает' });
      return;
    }
    setSaving(true);
    try {
      await apiChangePassword(oldPw, newPw);
      setFeedback({ kind: 'ok', text: 'Пароль обновлён' });
      setOldPw('');
      setNewPw('');
      setConfirm('');
    } catch (e: any) {
      setFeedback({ kind: 'err', text: e?.message || 'Не удалось сменить пароль' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="h-fit rounded-2xl border border-white/10 bg-white/[0.025] p-6 backdrop-blur-sm sm:p-7">
      <Head icon={<Lock className="h-5 w-5" />} title="Сменить пароль" />

      <div className="mt-5 space-y-4">
        <Field label="Текущий пароль">
          <input
            type="password"
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
            autoComplete="current-password"
            className={inputCls}
          />
        </Field>
        <Field label="Новый пароль (от 8 символов)">
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            autoComplete="new-password"
            className={inputCls}
          />
        </Field>
        <Field label="Повторите новый">
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className={inputCls}
          />
        </Field>

        {feedback && <Feedback kind={feedback.kind} text={feedback.text} />}

        <button
          onClick={submit}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08] disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Обновить пароль
        </button>
      </div>
    </section>
  );
}

function Head({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#38BDF8]/20 to-[#3B82F6]/20 text-[#38BDF8] ring-1 ring-inset ring-white/10">
        {icon}
      </span>
      <h2 className="text-base font-semibold text-white">{title}</h2>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function Feedback({ kind, text }: { kind: 'ok' | 'err'; text: string }) {
  return (
    <div
      className={
        kind === 'ok'
          ? 'inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300'
          : 'inline-flex items-center gap-2 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300'
      }
    >
      {kind === 'ok' ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      {text}
    </div>
  );
}
