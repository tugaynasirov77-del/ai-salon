'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, X, Loader2, Briefcase, UserCog, ArrowRight } from 'lucide-react';
import { submitLead } from '@/lib/api';
import { formatPhone } from '@/lib/utils';
import { NICHES } from '@shared/niches';
import { track } from '@/lib/analytics';
import { TiltCard } from '@/components/landing/TiltCard';

export function PricingSection() {
  const [open, setOpen] = useState(false);
  return (
    <section id="pricing" className="relative py-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E4BC74]">Тарифы</span>
          <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
            Прозрачно. Без скрытых платежей.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Один и тот же AI-администратор. Разница только в том, кто проводит подключение — вы сами за 15 минут или наш менеджер за вас за 1 день.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* === SELF-START === */}
          <TiltCard className="h-full">
          <div className="glass glow-hover relative flex h-full flex-col rounded-2xl p-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <UserCog className="h-3.5 w-3.5" />
              Self-Start
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">Подключаете сами</div>
            <p className="mt-3 text-sm text-slate-400">
              Для тех, кто хочет попробовать сам. Регистрация и подключение Telegram-канала — 15 минут по инструкции в админке.
            </p>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-semibold text-white">2 500 ₽</span>
              <span className="text-sm text-slate-400">/месяц</span>
            </div>
            <div className="mt-1 text-sm text-slate-500">Подключение бесплатно</div>

            <ul className="mt-6 flex-1 space-y-2.5 text-sm text-slate-300">
              <Feat>Telegram + веб-чат на сайт</Feat>
              <Feat>1 000 сообщений в месяц</Feat>
              <Feat>AI на Claude — отвечает как живой</Feat>
              <Feat>Все 9 ниш и готовые пресеты</Feat>
              <Feat>Дашборд, аналитика, тест-чат</Feat>
              <Feat>Эскалация владельцу в Telegram</Feat>
              <Feat>Поддержка по email</Feat>
            </ul>

            <Link
              href="/register"
              onClick={() => track('cta_register', { location: 'pricing_self_start' })}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
            >
              Попробовать бесплатно
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="mt-2 text-center text-xs text-slate-500">Без карты · отмена в один клик</div>
          </div>
          </TiltCard>

          {/* === TURNKEY === */}
          <TiltCard className="h-full">
          <div className="border-gradient relative flex h-full flex-col rounded-2xl border border-[#CD9842]/30 bg-gradient-to-b from-amber-950/30 via-amber-950/10 to-transparent p-8 backdrop-blur-sm shadow-[0_0_80px_-12px_rgba(205,152,66,0.45)]">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#E4BC74]">
                <Briefcase className="h-3.5 w-3.5" />
                Под ключ
              </div>
              <span className="rounded-full bg-gradient-to-r from-[#CD9842] via-[#CD9842] to-[#AC6824] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-[0_0_18px_rgba(205,152,66,0.5)]">
                Рекомендуем
              </span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">Подключим за вас</div>
            <p className="mt-3 text-sm text-slate-300">
              Мы всё настроим за 1 день: подключим каналы, перенесём прайс и расписание, доведём до первой записи.
            </p>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-semibold text-white">2 500 ₽</span>
              <span className="text-sm text-slate-400">/месяц</span>
            </div>
            <div className="mt-1 text-sm text-slate-400">+ 5 000 ₽ разово за подключение</div>

            <ul className="mt-6 flex-1 space-y-2.5 text-sm text-slate-200">
              <Feat>Всё из Self-Start</Feat>
              <Feat>Подключение Telegram, Авито и YClients под ключ</Feat>
              <Feat>Перенос вашего прайса и расписания</Feat>
              <Feat>Безлимит сообщений первые 3 месяца</Feat>
              <Feat>Адаптация тона ИИ под ваш бизнес</Feat>
              <Feat>Персональный менеджер на запуске</Feat>
              <Feat>Приоритетная поддержка</Feat>
            </ul>

            <button
              onClick={() => { track('cta_turnkey_open', { location: 'pricing_turnkey' }); setOpen(true); }}
              className="group relative mt-8 inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#CD9842] via-[#CD9842] to-[#AC6824] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_0_30px_rgba(205,152,66,0.4)] transition-transform hover:scale-[1.02]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Оставить заявку
              <ArrowRight className="h-4 w-4" />
            </button>
            <div className="mt-2 text-center text-xs text-slate-400">Менеджер свяжется с вами в течение дня</div>
          </div>
          </TiltCard>
        </div>
      </div>

      <LeadModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

function Feat({ children, off }: { children: React.ReactNode; off?: boolean }) {
  return (
    <li className={`flex items-start gap-2 ${off ? 'text-slate-500' : ''}`}>
      {off ? (
        <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-600" />
      ) : (
        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
      )}
      {children}
    </li>
  );
}

// ===========================================================================
// LEAD MODAL — форма заявки для тарифа «Под ключ»
// ===========================================================================

function LeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', niche: '', city: '', comment: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  async function submit() {
    if (!form.name.trim() || !form.phone.trim()) {
      setErr('Заполните имя и телефон');
      return;
    }
    setErr(null);
    setState('sending');
    try {
      await submitLead({
        name: form.name.trim(),
        phone: form.phone.trim(),
        niche: form.niche || undefined,
        city: form.city.trim() || undefined,
        comment: form.comment.trim() || undefined,
        source: 'landing-pricing-turnkey',
      });
      track('lead_submitted', {
        niche: form.niche || null,
        city: form.city.trim() || null,
        has_comment: !!form.comment.trim(),
        source: 'pricing_turnkey',
      });
      setState('sent');
    } catch (e: any) {
      setState('error');
      setErr(e?.message || 'Не удалось отправить. Попробуйте позже или напишите hello@ailiva.ru');
    }
  }

  function reset() {
    setForm({ name: '', phone: '', niche: '', city: '', comment: '' });
    setState('idle');
    setErr(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={reset}>
      <div className="absolute inset-0 bg-[#14100A]/80 backdrop-blur-sm" />
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#1A1612] shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 className="text-base font-semibold text-white">Заявка «Под ключ»</h3>
          <button onClick={reset} aria-label="Закрыть" className="text-slate-400 transition-colors hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="p-5">
          {state === 'sent' ? (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
                <Check className="h-7 w-7 text-emerald-400" />
              </div>
              <div className="mb-2 text-base font-semibold text-white">Заявка отправлена!</div>
              <p className="mb-4 text-sm text-slate-400">Менеджер свяжется с вами в течение дня.</p>
              <button onClick={reset} className="rounded-xl bg-gradient-to-r from-[#CD9842] via-[#CD9842] to-[#AC6824] px-6 py-2 text-sm font-semibold text-white">
                Закрыть
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                Менеджер свяжется в течение дня. Подключит всё за вас и проведёт по первым шагам.
              </p>
              <ModalField label="Как вас зовут *">
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Иван Петров"
                  className={modalInputCls}
                />
              </ModalField>
              <ModalField label="Телефон *">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
                  placeholder="+7 (___) ___-__-__"
                  className={modalInputCls}
                />
              </ModalField>
              <div className="grid grid-cols-2 gap-3">
                <ModalField label="Ниша">
                  <select
                    value={form.niche}
                    onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))}
                    className={modalInputCls + ' px-2'}
                  >
                    <option value="">— Не указано —</option>
                    {Object.entries(NICHES).map(([key, n]: any) => (
                      <option key={key} value={key}>{n.emoji} {n.label}</option>
                    ))}
                  </select>
                </ModalField>
                <ModalField label="Город">
                  <input
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="Москва"
                    className={modalInputCls}
                  />
                </ModalField>
              </div>
              <ModalField label="Комментарий">
                <textarea
                  rows={2}
                  value={form.comment}
                  onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                  placeholder="Что важно учесть, какие каналы используете…"
                  className={modalInputCls + ' resize-none py-2'}
                />
              </ModalField>
              {err && <div className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300">{err}</div>}
              <button
                onClick={submit}
                disabled={state === 'sending'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#CD9842] via-[#CD9842] to-[#AC6824] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(205,152,66,0.4)] transition-transform hover:scale-[1.01] disabled:opacity-60"
              >
                {state === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
                Отправить заявку
              </button>
              <p className="text-center text-[11px] text-slate-500">
                Отправляя форму, вы соглашаетесь, что мы свяжемся с вами по указанному телефону.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const modalInputCls =
  'h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-slate-500 focus:border-[#CD9842] focus:outline-none focus:ring-2 focus:ring-[#CD9842]/30';

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-400">{label}</label>
      {children}
    </div>
  );
}
