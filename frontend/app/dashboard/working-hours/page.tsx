'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Copy, Loader2, CalendarClock } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { fetchWorkingHours, saveWorkingHours, fetchMasters, type IWorkingHour } from '@/lib/api';
import { useSalonId } from '@/lib/config';
import { cn } from '@/lib/utils';

// Дни недели в UI: понедельник первый. weekday в API: 0=вс..6=сб.
const WEEK = [
  { weekday: 1, label: 'Понедельник', short: 'Пн', weekend: false },
  { weekday: 2, label: 'Вторник', short: 'Вт', weekend: false },
  { weekday: 3, label: 'Среда', short: 'Ср', weekend: false },
  { weekday: 4, label: 'Четверг', short: 'Чт', weekend: false },
  { weekday: 5, label: 'Пятница', short: 'Пт', weekend: false },
  { weekday: 6, label: 'Суббота', short: 'Сб', weekend: true },
  { weekday: 0, label: 'Воскресенье', short: 'Вс', weekend: true },
] as const;

const DEFAULT_FROM = '09:00';
const DEFAULT_TO = '21:00';

interface DayState {
  open: boolean;
  from: string;
  to: string;
}

type StateByDay = Record<number, DayState>;

function minToTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function buildState(hours: IWorkingHour[] | undefined): StateByDay {
  const state: StateByDay = {};
  for (const w of WEEK) {
    state[w.weekday] = { open: false, from: DEFAULT_FROM, to: DEFAULT_TO };
  }
  (hours || []).forEach((h) => {
    state[h.weekday] = { open: true, from: minToTime(h.fromMin), to: minToTime(h.toMin) };
  });
  return state;
}

function stateToHours(state: StateByDay) {
  const out: Array<{ weekday: number; fromMin: number; toMin: number }> = [];
  for (const w of WEEK) {
    const d = state[w.weekday];
    if (!d?.open) continue;
    out.push({ weekday: w.weekday, fromMin: timeToMin(d.from), toMin: timeToMin(d.to) });
  }
  return out;
}

export default function WorkingHoursPage() {
  const SALON_ID = useSalonId();
  const qc = useQueryClient();

  const [masterId, setMasterId] = useState<string | null>(null);
  const [state, setState] = useState<StateByDay>(() => buildState([]));
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const masters = useQuery({ queryKey: ['masters', SALON_ID], queryFn: () => fetchMasters(SALON_ID) });
  const hoursQ = useQuery({
    queryKey: ['working-hours', SALON_ID, masterId],
    queryFn: () => fetchWorkingHours(SALON_ID, masterId),
  });

  // Гидрация state из ответа API при смене селектора / первой загрузке
  useEffect(() => {
    if (!hoursQ.data) return;
    setState(buildState(hoursQ.data));
    setDirty(false);
    setError(null);
  }, [hoursQ.data, masterId]);

  const saveMut = useMutation({
    mutationFn: () => saveWorkingHours(SALON_ID, masterId, stateToHours(state)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['working-hours', SALON_ID, masterId] });
      setDirty(false);
      setSavedAt(Date.now());
      setError(null);
    },
    onError: (e: any) => setError(e?.message || 'Не удалось сохранить'),
  });

  function update(weekday: number, patch: Partial<DayState>) {
    setState((s) => ({ ...s, [weekday]: { ...s[weekday], ...patch } }));
    setDirty(true);
    setSavedAt(null);
  }

  function copyWeekdaysToWeekend() {
    const monday = state[1];
    if (!monday) return;
    setState((s) => ({
      ...s,
      6: { ...monday },
      0: { ...monday },
    }));
    setDirty(true);
  }

  function copyToAll() {
    const monday = state[1];
    if (!monday) return;
    const next: StateByDay = {};
    for (const w of WEEK) next[w.weekday] = { ...monday };
    setState(next);
    setDirty(true);
  }

  // Валидация — для всех открытых дней from < to
  const invalidDays = useMemo(() => {
    const bad: number[] = [];
    for (const w of WEEK) {
      const d = state[w.weekday];
      if (d?.open && timeToMin(d.from) >= timeToMin(d.to)) bad.push(w.weekday);
    }
    return bad;
  }, [state]);

  const targetLabel = masterId
    ? masters.data?.find((m) => m.id === masterId)?.name || 'Мастер'
    : 'Расписание салона';

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <PageHeader
          title="График работы"
          description="Часы, когда салон или конкретный мастер принимает клиентов. AI учитывает это при подборе времени записи."
        />
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[240px]">
            <Label htmlFor="wh-target">Для кого</Label>
            <select
              id="wh-target"
              value={masterId ?? ''}
              onChange={(e) => setMasterId(e.target.value || null)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">Расписание салона (по умолчанию)</option>
              {(masters.data || []).map((m) => (
                <option key={m.id} value={m.id}>
                  Мастер: {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyWeekdaysToWeekend}>
              <Copy className="h-3.5 w-3.5" />
              Пн → Сб/Вс
            </Button>
            <Button variant="outline" size="sm" onClick={copyToAll}>
              <Copy className="h-3.5 w-3.5" />
              Пн на всю неделю
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        {hoursQ.isLoading ? (
          <div className="py-12">
            <LoadingSpinner label="Загружаем расписание…" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {WEEK.map((w) => {
              const d = state[w.weekday];
              const invalid = invalidDays.includes(w.weekday);
              return (
                <div
                  key={w.weekday}
                  className={cn(
                    'flex flex-wrap items-center gap-4 px-5 py-3',
                    !d?.open && 'bg-slate-50/50 dark:bg-slate-900/30',
                  )}
                >
                  <label className="flex w-44 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!!d?.open}
                      onChange={(e) => update(w.weekday, { open: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span
                      className={cn(
                        'text-sm font-medium',
                        d?.open ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400',
                        w.weekend && 'text-orange-600 dark:text-orange-400',
                      )}
                    >
                      {w.label}
                    </span>
                  </label>

                  {d?.open ? (
                    <>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={d.from}
                          onChange={(e) => update(w.weekday, { from: e.target.value })}
                          className={cn(
                            'h-9 rounded-md border bg-white px-2 text-sm dark:bg-slate-900',
                            invalid ? 'border-red-400' : 'border-slate-300 dark:border-slate-700',
                          )}
                        />
                        <span className="text-slate-400">—</span>
                        <input
                          type="time"
                          value={d.to}
                          onChange={(e) => update(w.weekday, { to: e.target.value })}
                          className={cn(
                            'h-9 rounded-md border bg-white px-2 text-sm dark:bg-slate-900',
                            invalid ? 'border-red-400' : 'border-slate-300 dark:border-slate-700',
                          )}
                        />
                      </div>
                      {invalid && (
                        <span className="text-xs text-red-600">Время окончания должно быть позже начала</span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-slate-400">Выходной</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {dirty ? (
            <span className="text-amber-600">Есть несохранённые изменения</span>
          ) : savedAt ? (
            <span className="text-green-600">Сохранено</span>
          ) : (
            <>Редактируете: <b>{targetLabel}</b></>
          )}
          {error && <span className="ml-3 text-red-600">{error}</span>}
        </div>
        <Button onClick={() => saveMut.mutate()} disabled={!dirty || saveMut.isPending || invalidDays.length > 0}>
          {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Сохранить
        </Button>
      </div>
    </div>
  );
}
