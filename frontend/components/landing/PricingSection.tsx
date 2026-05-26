'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, X, Loader2, Briefcase, UserCog } from 'lucide-react';
import { submitLead } from '@/lib/api';
import { formatPhone } from '@/lib/utils';
import { NICHES } from '@shared/niches';

export function PricingSection() {
  const [open, setOpen] = useState(false);
  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-slate-100">Тарифы</h2>
        <p className="mt-2 text-center text-slate-500">
          Выберите как удобнее: подключить самостоятельно или с нашей помощью.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* === SELF-START === */}
          <div className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <UserCog className="h-3.5 w-3.5" />
              Самостоятельно
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">Self-Start</div>
            <p className="mt-2 text-sm text-slate-500">
              Регистрируетесь сами, подключаете Telegram и настраиваете бота через админку. Готово за 15–30 минут.
            </p>

            <div className="mt-5">
              <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">2 500 ₽</span>
              <span className="ml-2 text-sm text-slate-500">в месяц</span>
            </div>
            <div className="mt-1 text-sm text-slate-500">Подключение — бесплатно, без setup-платы</div>

            <ul className="mt-6 flex-1 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />Вы сами подключаете Telegram-бота (инструкция в админке)</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />Вы сами заносите услуги, мастеров и расписание</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />Веб-чат на сайт за один скрипт</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />Дашборд, аналитика и тест-чат для проверки бота</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />До 1000 сообщений в месяц</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />Поддержка по email</li>
              <li className="flex items-start gap-2 text-slate-400"><X className="mt-0.5 h-4 w-4 flex-shrink-0" />Без подключения Авито и YClients</li>
              <li className="flex items-start gap-2 text-slate-400"><X className="mt-0.5 h-4 w-4 flex-shrink-0" />Без персонального менеджера</li>
            </ul>

            <Link
              href="/register"
              className="mt-8 rounded-lg border border-slate-300 px-6 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Зарегистрироваться самому
            </Link>
            <div className="mt-2 text-center text-xs text-slate-400">Готово за 15–30 минут</div>
          </div>

          {/* === TURNKEY === */}
          <div className="relative flex flex-col rounded-2xl border-2 border-blue-600 bg-blue-50 p-8 shadow-lg dark:bg-blue-950/30">
            <div className="absolute -top-3 left-8 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-white">
              Рекомендуем
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              <Briefcase className="h-3.5 w-3.5" />
              Под ключ
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">Мы всё настроим за вас</div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Оставьте заявку — наш менеджер свяжется в течение дня и проведёт вас от подключения до первого клиента.
            </p>

            <div className="mt-5">
              <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">2 500 ₽</span>
              <span className="ml-2 text-sm text-slate-500">в месяц</span>
            </div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">+ 5 000 ₽ единоразовая настройка</div>

            <ul className="mt-6 flex-1 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />Всё из Self-Start</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />Менеджер сам подключит Telegram, Авито и YClients</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />Перенесём ваш прайс и расписание</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />Адаптируем тон бота под ваш бизнес</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />Персональный менеджер на связи</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />Безлимит сообщений в первые 3 месяца</li>
            </ul>

            <button
              onClick={() => setOpen(true)}
              className="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
            >
              Оставить заявку
            </button>
            <div className="mt-2 text-center text-xs text-slate-500">Менеджер свяжется в течение дня</div>
          </div>
        </div>
      </div>

      <LeadModal open={open} onClose={() => setOpen(false)} />
    </section>
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
      <div className="absolute inset-0 bg-black/50" />
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Заявка «Под ключ»</h3>
          <button onClick={reset} aria-label="Закрыть" className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="p-5">
          {state === 'sent' ? (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <div className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">Заявка отправлена!</div>
              <p className="mb-4 text-sm text-slate-500">Менеджер свяжется с вами в течение дня.</p>
              <button onClick={reset} className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Закрыть
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Менеджер свяжется в течение дня. Подключит всё за вас и проведёт по первым шагам.
              </p>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Как вас зовут *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Иван Петров"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Телефон *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
                  placeholder="+7 (___) ___-__-__"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Ниша</label>
                  <select
                    value={form.niche}
                    onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">— Не указано —</option>
                    {Object.entries(NICHES).map(([key, n]: any) => (
                      <option key={key} value={key}>{n.emoji} {n.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Город</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="Москва"
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Комментарий</label>
                <textarea
                  rows={2}
                  value={form.comment}
                  onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                  placeholder="Что важно учесть, какие каналы используете…"
                  className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              {err && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{err}</div>}
              <button
                onClick={submit}
                disabled={state === 'sending'}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
              >
                {state === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
                Отправить заявку
              </button>
              <p className="text-center text-[11px] text-slate-400">
                Отправляя форму, вы соглашаетесь, что мы свяжемся с вами по указанному телефону.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
