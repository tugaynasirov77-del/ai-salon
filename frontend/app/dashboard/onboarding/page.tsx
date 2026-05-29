'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Loader2,
  Plus,
  Trash2,
  Scissors,
  CalendarClock,
  Send,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  PartyPopper,
} from 'lucide-react';
import { useSalonId } from '@/lib/config';
import { useAuthStore } from '@/lib/auth';
import {
  fetchServices,
  createService,
  saveWorkingHours,
  connectTelegram,
  type IService,
} from '@/lib/api';

const STEPS = ['Услуги', 'Расписание', 'Telegram', 'Готово'] as const;

const inputCls =
  'h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-amber-200">
          <Sparkles className="h-3.5 w-3.5" />
          Быстрая настройка
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Запустим вашего ИИ-администратора</h1>
        <p className="mt-2 text-sm text-slate-400">Три коротких шага. Любой можно пропустить и заполнить позже.</p>
      </div>

      {/* Stepper */}
      <div className="mt-8 flex items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                i < step
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-inset ring-emerald-400/30'
                  : i === step
                    ? 'bg-gradient-to-br from-amber-500 to-amber-500 text-white'
                    : 'bg-white/[0.04] text-slate-500 ring-1 ring-inset ring-white/10'
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-6 sm:w-10 ${i < step ? 'bg-emerald-400/40' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-6 backdrop-blur-sm sm:p-8">
        {step === 0 && <StepServices onNext={next} />}
        {step === 1 && <StepSchedule onNext={next} onBack={back} />}
        {step === 2 && <StepTelegram onNext={next} onBack={back} />}
        {step === 3 && <StepDone onFinish={() => router.replace('/dashboard')} />}
      </div>

      {step < 3 && (
        <p className="mt-5 text-center text-sm text-slate-500">
          <button onClick={() => router.replace('/dashboard')} className="underline-offset-2 hover:text-slate-300 hover:underline">
            Пропустить настройку и перейти в дашборд
          </button>
        </p>
      )}
    </div>
  );
}

// ===========================================================================
// Шаг 1 — Услуги
// ===========================================================================

function StepServices({ onNext }: { onNext: () => void }) {
  const salonId = useSalonId();
  const [items, setItems] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('60');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchServices(salonId)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salonId]);

  async function add() {
    if (!name.trim() || !price) {
      setErr('Укажите название и цену');
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      const created = await createService(salonId, {
        name: name.trim(),
        price: Number(price),
        durationMin: duration ? Number(duration) : undefined,
      });
      setItems((prev) => [...prev, created]);
      setName('');
      setPrice('');
      setDuration('60');
    } catch (e: any) {
      setErr(e?.message || 'Не удалось добавить услугу');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Head icon={<Scissors className="h-5 w-5" />} title="Добавьте услуги" text="ИИ будет предлагать их клиентам и записывать. Минимум одну — остальное можно добавить позже." />

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_120px]">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Стрижка" className={inputCls} />
        <input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Цена ₽" className={inputCls} />
        <input value={duration} onChange={(e) => setDuration(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Мин" className={inputCls} />
      </div>
      {err && <div className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{err}</div>}
      <button
        onClick={add}
        disabled={saving}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.08] disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Добавить услугу
      </button>

      <div className="mt-6 space-y-2">
        {loading ? (
          <div className="text-sm text-slate-500">Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-500">
            Пока нет услуг
          </div>
        ) : (
          items.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm">
              <span className="text-slate-200">{s.name}</span>
              <span className="text-slate-400">
                {s.price.toLocaleString('ru-RU')} ₽{s.durationMin ? ` · ${s.durationMin} мин` : ''}
              </span>
            </div>
          ))
        )}
      </div>

      <NavRow>
        <span />
        <NextBtn onClick={onNext} label={items.length ? 'Далее' : 'Пропустить'} />
      </NavRow>
    </div>
  );
}

// ===========================================================================
// Шаг 2 — Расписание салона
// ===========================================================================

// API weekday: 0=вс..6=сб. В UI начинаем с понедельника.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABEL: Record<number, string> = { 1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 0: 'Вс' };

function minToTime(m: number) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

type DayState = { open: boolean; from: string; to: string };

function StepSchedule({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const salonId = useSalonId();
  // Дефолт: будни 10:00–20:00 открыты, выходные закрыты.
  const [days, setDays] = useState<Record<number, DayState>>(() => {
    const init: Record<number, DayState> = {};
    DAY_ORDER.forEach((d) => {
      init[d] = { open: d >= 1 && d <= 5, from: '10:00', to: '20:00' };
    });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function upd(d: number, patch: Partial<DayState>) {
    setDays((prev) => ({ ...prev, [d]: { ...prev[d], ...patch } }));
  }

  const invalid = DAY_ORDER.some((d) => days[d].open && timeToMin(days[d].from) >= timeToMin(days[d].to));

  async function save(skip = false) {
    if (skip) {
      onNext();
      return;
    }
    if (invalid) {
      setErr('Время «с» должно быть раньше «до» во всех открытых днях');
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      const hours = DAY_ORDER.filter((d) => days[d].open).map((d) => ({
        weekday: d,
        fromMin: timeToMin(days[d].from),
        toMin: timeToMin(days[d].to),
      }));
      await saveWorkingHours(salonId, null, hours);
      onNext();
    } catch (e: any) {
      setErr(e?.message || 'Не удалось сохранить расписание');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Head icon={<CalendarClock className="h-5 w-5" />} title="Часы работы салона" text="ИИ предлагает запись только в рабочее время. Будни заполнены по умолчанию — поправьте под себя." />

      <div className="mt-6 space-y-2">
        {DAY_ORDER.map((d) => {
          const st = days[d];
          const bad = st.open && timeToMin(st.from) >= timeToMin(st.to);
          const weekend = d === 6 || d === 0;
          return (
            <div key={d} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${weekend ? 'border-orange-400/10 bg-orange-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
              <label className="flex w-20 shrink-0 cursor-pointer items-center gap-2 text-sm text-slate-200">
                <input type="checkbox" checked={st.open} onChange={(e) => upd(d, { open: e.target.checked })} className="accent-amber-500" />
                {DAY_LABEL[d]}
              </label>
              {st.open ? (
                <div className="flex items-center gap-2">
                  <input type="time" value={st.from} onChange={(e) => upd(d, { from: e.target.value })} className={`h-9 rounded-md border bg-white/[0.04] px-2 text-sm text-white ${bad ? 'border-red-400/60' : 'border-white/10'}`} />
                  <span className="text-slate-500">—</span>
                  <input type="time" value={st.to} onChange={(e) => upd(d, { to: e.target.value })} className={`h-9 rounded-md border bg-white/[0.04] px-2 text-sm text-white ${bad ? 'border-red-400/60' : 'border-white/10'}`} />
                </div>
              ) : (
                <span className="text-sm text-slate-500">Выходной</span>
              )}
            </div>
          );
        })}
      </div>

      {err && <div className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{err}</div>}

      <NavRow>
        <BackBtn onClick={onBack} />
        <div className="flex items-center gap-2">
          <button onClick={() => save(true)} className="text-sm text-slate-500 hover:text-slate-300">Пропустить</button>
          <NextBtn onClick={() => save(false)} disabled={saving || invalid} loading={saving} label="Сохранить и далее" />
        </div>
      </NavRow>
    </div>
  );
}

// ===========================================================================
// Шаг 3 — Telegram
// ===========================================================================

function StepTelegram({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const salonId = useSalonId();
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function connect() {
    if (!token.trim()) {
      setErr('Вставьте токен Telegram-канала');
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      await connectTelegram(salonId, token.trim());
      setDone(true);
      setTimeout(onNext, 800);
    } catch (e: any) {
      setErr(e?.message || 'Не удалось подключить. Проверьте токен.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Head icon={<Send className="h-5 w-5" />} title="Подключите Telegram" text="Так ИИ начнёт отвечать клиентам в вашем Telegram-канале. Можно пропустить и подключить позже в Настройках." />

      <ol className="mt-6 space-y-2 text-sm text-slate-300">
        <li>1. Откройте <span className="font-medium text-white">@BotFather</span> в Telegram → команда <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs">/newbot</span></li>
        <li>2. Задайте имя и юзернейм канала</li>
        <li>3. Скопируйте выданный токен и вставьте сюда</li>
      </ol>

      <input
        value={token}
        onChange={(e) => setToken(e.target.value)}
        type="password"
        placeholder="123456789:AAE..."
        className={`${inputCls} mt-5`}
      />
      {err && <div className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{err}</div>}
      {done && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
          <Check className="h-4 w-4" /> Канал подключён
        </div>
      )}

      <NavRow>
        <BackBtn onClick={onBack} />
        <div className="flex items-center gap-2">
          <button onClick={onNext} className="text-sm text-slate-500 hover:text-slate-300">Пропустить</button>
          <NextBtn onClick={connect} disabled={saving || done} loading={saving} label="Подключить" />
        </div>
      </NavRow>
    </div>
  );
}

// ===========================================================================
// Шаг 4 — Готово
// ===========================================================================

function StepDone({ onFinish }: { onFinish: () => void }) {
  const salon = useAuthStore((s) => s.salon);
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-500/30 text-amber-200 ring-1 ring-inset ring-white/10">
        <PartyPopper className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-white">Готово{salon?.name ? `, ${salon.name}` : ''}!</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
        Базовая настройка завершена. Проверьте, как отвечает ИИ, в разделе «Тест-чат», а реальные диалоги и записи появятся в дашборде.
      </p>
      <button
        onClick={onFinish}
        className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-500 px-7 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(217,146,32,0.4)] transition-transform hover:scale-[1.02]"
      >
        Перейти в дашборд
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ===========================================================================
// Мелкие UI-хелперы
// ===========================================================================

function Head({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 via-amber-500/20 to-amber-500/20 text-amber-200 ring-1 ring-inset ring-white/10">
        {icon}
      </div>
      <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

function NavRow({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-5">{children}</div>;
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white">
      <ArrowLeft className="h-4 w-4" />
      Назад
    </button>
  );
}

function NextBtn({ onClick, label, disabled, loading }: { onClick: () => void; label: string; disabled?: boolean; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(217,146,32,0.4)] transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
      {!loading && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}
