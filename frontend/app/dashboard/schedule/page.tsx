'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus, Trash2, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  fetchAppointments,
  fetchMasters,
  fetchServices,
  fetchClients,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from '@/lib/api';
import { useSalonId } from '@/lib/config';
import { cn, startOfWeek, addDays, toISODate, fmtDayMonth, fmtWeekday } from '@/lib/utils';
import type { IAppointment, AppointmentStatus } from '@shared/types';

const DAY_START_MIN = 9 * 60;          // 09:00
const DAY_END_MIN = 21 * 60;           // 21:00
const SLOT_MIN = 30;                   // шаг сетки — 30 минут
const SLOT_HEIGHT = 32;                // высота слота в px

const STATUS: Record<AppointmentStatus, { color: string; label: string }> = {
  confirmed: { color: 'bg-green-500 border-green-600',  label: 'Подтверждена' },
  completed: { color: 'bg-slate-400 border-slate-500',  label: 'Завершена' },
  cancelled: { color: 'bg-red-500 border-red-600',      label: 'Отменена' },
  no_show:   { color: 'bg-orange-500 border-orange-600',label: 'Не пришёл' },
};

// Минуты от 00:00 локальной зоны
function minutesOf(d: Date | string): number {
  const x = typeof d === 'string' ? new Date(d) : d;
  return x.getHours() * 60 + x.getMinutes();
}
function sameDay(a: Date | string, b: Date): boolean {
  const x = typeof a === 'string' ? new Date(a) : a;
  return x.getFullYear() === b.getFullYear() && x.getMonth() === b.getMonth() && x.getDate() === b.getDate();
}

export default function SchedulePage() {
  const SALON_ID = useSalonId();
  const qc = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [masterFilter, setMasterFilter] = useState<string>('all');
  const [createSlot, setCreateSlot] = useState<{ date: Date; minute: number } | null>(null);
  const [editing, setEditing] = useState<IAppointment | null>(null);

  const weekEnd = addDays(weekStart, 6);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const slots = useMemo(() => {
    const out: number[] = [];
    for (let m = DAY_START_MIN; m < DAY_END_MIN; m += SLOT_MIN) out.push(m);
    return out;
  }, []);

  // Запросы
  const apptsQ = useQuery({
    queryKey: ['appointments', SALON_ID, toISODate(weekStart), toISODate(weekEnd), masterFilter],
    queryFn: () =>
      fetchAppointments(SALON_ID, {
        from: toISODate(weekStart),
        to: toISODate(addDays(weekEnd, 1)),
        masterId: masterFilter === 'all' ? undefined : masterFilter,
      }),
  });
  const mastersQ = useQuery({ queryKey: ['masters', SALON_ID], queryFn: () => fetchMasters(SALON_ID) });
  const servicesQ = useQuery({ queryKey: ['services', SALON_ID], queryFn: () => fetchServices(SALON_ID) });
  const clientsQ = useQuery({ queryKey: ['clients', SALON_ID], queryFn: () => fetchClients(SALON_ID) });

  // Длительность услуги — джойним на клиенте: бэк не отдаёт durationMin в Appointment.
  // Сначала пробуем встроенный serviceRef (если бэк прислал), потом по id, потом по имени.
  const serviceDurationByName = useMemo(() => {
    const m = new Map<string, number>();
    (servicesQ.data || []).forEach((s) => { if (s.durationMin) m.set(s.name, s.durationMin); });
    return m;
  }, [servicesQ.data]);
  const serviceDurationById = useMemo(() => {
    const m = new Map<string, number>();
    (servicesQ.data || []).forEach((s) => { if (s.durationMin) m.set(s.id, s.durationMin); });
    return m;
  }, [servicesQ.data]);
  function durationFor(a: IAppointment): number {
    const ref = (a as any).serviceRef?.durationMin;
    if (ref) return ref;
    const byId = (a as any).serviceId ? serviceDurationById.get((a as any).serviceId) : undefined;
    if (byId) return byId;
    const byName = a.service ? serviceDurationByName.get(a.service) : undefined;
    return byName ?? 60;
  }

  function reload() {
    qc.invalidateQueries({ queryKey: ['appointments', SALON_ID] });
  }

  return (
    <div>
      <PageHeader title="Расписание" description="Записи салона по неделям и мастерам." />

      {/* Тулбар */}
      <Card className="mb-4 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Предыдущая неделя">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
              Сегодня
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Следующая неделя">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              {fmtDayMonth(weekStart)} — {fmtDayMonth(weekEnd)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="mb-0 mr-1">Мастер:</Label>
            <select
              value={masterFilter}
              onChange={(e) => setMasterFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-[#232831]"
            >
              <option value="all">Все мастера</option>
              {(mastersQ.data || []).map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Сетка */}
      <Card className="overflow-hidden">
        {apptsQ.isLoading ? (
          <LoadingSpinner label="Загружаем расписание…" />
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-[800px]" style={{ gridTemplateColumns: '60px repeat(7, minmax(0,1fr))' }}>
              {/* Заголовки дней */}
              <div className="border-b border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#232831]/50" />
              {days.map((d) => {
                const isToday = sameDay(new Date(), d);
                return (
                  <div
                    key={d.toISOString()}
                    className={cn(
                      'border-b border-r border-slate-200 bg-slate-50 py-2 text-center dark:border-slate-800 dark:bg-[#232831]/50',
                      isToday && 'bg-amber-50 dark:bg-amber-950/30',
                    )}
                  >
                    <div className="text-[10px] uppercase text-slate-500">{fmtWeekday(d)}</div>
                    <div className={cn('text-sm font-semibold', isToday ? 'text-amber-600' : 'text-[#232831] dark:text-slate-100')}>
                      {fmtDayMonth(d)}
                    </div>
                  </div>
                );
              })}

              {/* Колонка времени */}
              <div className="relative border-r border-slate-200 dark:border-slate-800">
                {slots.map((m) => (
                  <div
                    key={m}
                    className="border-b border-slate-100 px-1 text-right text-[10px] text-slate-400 dark:border-slate-800"
                    style={{ height: SLOT_HEIGHT }}
                  >
                    {m % 60 === 0 ? `${m / 60}:00` : ''}
                  </div>
                ))}
              </div>

              {/* Колонки дней с записями */}
              {days.map((d) => {
                const dayAppts = (apptsQ.data || []).filter((a) => sameDay(a.datetime, d));
                return (
                  <div key={d.toISOString()} className="relative border-r border-slate-200 dark:border-slate-800">
                    {/* Слоты-кнопки */}
                    {slots.map((m) => (
                      <button
                        key={m}
                        onClick={() => setCreateSlot({ date: d, minute: m })}
                        className="block w-full border-b border-slate-100 hover:bg-amber-50/50 dark:border-slate-800 dark:hover:bg-amber-950/20"
                        style={{ height: SLOT_HEIGHT }}
                        aria-label="Создать запись"
                      />
                    ))}
                    {/* Записи поверх */}
                    {dayAppts.map((a) => {
                      const start = minutesOf(a.datetime);
                      if (start < DAY_START_MIN || start >= DAY_END_MIN) return null;
                      const dur = durationFor(a); // джойн через service.id/name (см. helper выше)
                      const top = ((start - DAY_START_MIN) / SLOT_MIN) * SLOT_HEIGHT;
                      const height = Math.max((dur / SLOT_MIN) * SLOT_HEIGHT - 2, 24);
                      const s = STATUS[a.status];
                      return (
                        <button
                          key={a.id}
                          onClick={() => setEditing(a)}
                          className={cn(
                            'absolute left-0.5 right-0.5 rounded border-l-4 bg-opacity-90 px-1.5 py-1 text-left text-[11px] leading-tight text-white shadow-sm hover:opacity-90',
                            s.color,
                          )}
                          style={{ top, height }}
                          title={s.label}
                        >
                          <div className="font-semibold">
                            {new Date(a.datetime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="truncate">{a.service}</div>
                          {a.master && <div className="truncate text-[10px] opacity-90">· {a.master}</div>}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
        {(['confirmed', 'completed', 'no_show', 'cancelled'] as AppointmentStatus[]).map((st) => (
          <span key={st} className="inline-flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-sm', STATUS[st].color.split(' ')[0])} />
            {STATUS[st].label}
          </span>
        ))}
      </div>

      {/* Модалка создания */}
      <CreateAppointmentModal
        salonId={SALON_ID}
        slot={createSlot}
        onClose={() => setCreateSlot(null)}
        onCreated={() => {
          setCreateSlot(null);
          reload();
        }}
        masters={mastersQ.data || []}
        services={servicesQ.data || []}
        clients={clientsQ.data || []}
      />

      {/* Модалка правки */}
      <EditAppointmentModal
        appointment={editing}
        onClose={() => setEditing(null)}
        onChanged={() => {
          setEditing(null);
          reload();
        }}
      />
    </div>
  );
}

// ============================================================
// Модалка создания записи
// ============================================================

function CreateAppointmentModal({
  salonId,
  slot,
  onClose,
  onCreated,
  masters,
  services,
  clients,
}: {
  salonId: string;
  slot: { date: Date; minute: number } | null;
  onClose: () => void;
  onCreated: () => void;
  masters: Array<{ id: string; name: string }>;
  services: Array<{ id: string; name: string }>;
  clients: Array<{ id: string; name?: string | null; phone?: string | null }>;
}) {
  const [service, setService] = useState('');
  const [master, setMaster] = useState('');
  const [clientId, setClientId] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Инициализация формы при открытии
  useMemoInit(slot, () => {
    setError(null);
    setService(services[0]?.name || '');
    setMaster('');
    setClientId(clients[0]?.id || '');
    if (slot) {
      const h = String(Math.floor(slot.minute / 60)).padStart(2, '0');
      const m = String(slot.minute % 60).padStart(2, '0');
      setTime(`${h}:${m}`);
    }
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!slot) throw new Error('no slot');
      if (!clientId) throw new Error('Выберите клиента');
      if (!service.trim()) throw new Error('Укажите услугу');
      const [h, m] = time.split(':').map(Number);
      const dt = new Date(slot.date);
      dt.setHours(h || 0, m || 0, 0, 0);
      return createAppointment({
        salonId,
        clientId,
        service: service.trim(),
        datetime: dt.toISOString(),
        master: master || undefined,
      });
    },
    onSuccess: onCreated,
    onError: (e: any) => setError(e?.message || 'Ошибка создания'),
  });

  return (
    <Modal open={!!slot} onClose={onClose} title="Новая запись" maxWidth="md">
      <div className="space-y-4">
        <div>
          <Label>Клиент</Label>
          {clients.length === 0 ? (
            <div className="text-sm text-slate-400">Сначала добавьте клиента — пока у салона нет ни одного.</div>
          ) : (
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-[#232831]"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || 'Без имени'} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <Label>Услуга</Label>
          {services.length > 0 ? (
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-[#232831]"
            >
              {services.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          ) : (
            <Input value={service} onChange={(e) => setService(e.target.value)} placeholder="Стрижка, Маникюр, …" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Мастер</Label>
            <select
              value={master}
              onChange={(e) => setMaster(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-[#232831]"
            >
              <option value="">Не выбран</option>
              {masters.map((m) => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Время</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
          Отмена
        </Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || clients.length === 0}>
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Создать
        </Button>
      </div>
    </Modal>
  );
}

// ============================================================
// Модалка правки записи
// ============================================================

function EditAppointmentModal({
  appointment,
  onClose,
  onChanged,
}: {
  appointment: IAppointment | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [time, setTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  useMemoInit(appointment, () => {
    setError(null);
    if (appointment) {
      const d = new Date(appointment.datetime);
      setTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    }
  });

  const update = useMutation({
    mutationFn: async (data: Parameters<typeof updateAppointment>[1]) => {
      if (!appointment) throw new Error('no appointment');
      return updateAppointment(appointment.id, data);
    },
    onSuccess: onChanged,
    onError: (e: any) => setError(e?.message || 'Ошибка'),
  });

  const del = useMutation({
    mutationFn: async () => {
      if (!appointment) throw new Error('no appointment');
      return deleteAppointment(appointment.id);
    },
    onSuccess: onChanged,
    onError: (e: any) => setError(e?.message || 'Ошибка'),
  });

  if (!appointment) return null;
  const dt = new Date(appointment.datetime);

  return (
    <Modal open={!!appointment} onClose={onClose} title="Запись" maxWidth="md">
      <div className="space-y-4 text-sm">
        <div>
          <div className="text-xs uppercase text-slate-500">Услуга</div>
          <div className="font-medium text-[#232831] dark:text-slate-100">{appointment.service}</div>
        </div>
        {appointment.master && (
          <div>
            <div className="text-xs uppercase text-slate-500">Мастер</div>
            <div className="text-slate-700 dark:text-slate-300">{appointment.master}</div>
          </div>
        )}
        <div>
          <div className="text-xs uppercase text-slate-500">Дата</div>
          <div className="text-slate-700 dark:text-slate-300">{fmtDayMonth(dt)}</div>
        </div>
        <div>
          <Label>Перенести на</Label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-36"
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            disabled={update.isPending}
            onClick={() => {
              const [h, m] = time.split(':').map(Number);
              const next = new Date(dt);
              next.setHours(h || 0, m || 0, 0, 0);
              update.mutate({ datetime: next.toISOString() });
            }}
          >
            Перенести
          </Button>
        </div>
        <div>
          <Label>Статус</Label>
          <div className="flex flex-wrap gap-2">
            {(['confirmed', 'completed', 'no_show', 'cancelled'] as AppointmentStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => update.mutate({ status: st })}
                disabled={update.isPending}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  appointment.status === st
                    ? 'border-amber-600 bg-amber-600 text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                {STATUS[st].label}
              </button>
            ))}
          </div>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
      <div className="mt-5 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm('Удалить запись?')) del.mutate();
          }}
          disabled={del.isPending}
          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          {del.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Удалить
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Закрыть
        </Button>
      </div>
    </Modal>
  );
}

// ============================================================
// Хук: выполнить init-эффект при изменении ключа (open/null)
// ============================================================

function useMemoInit<T>(key: T, fn: () => void) {
  const prev = useMemoRef(key);
  if (prev.current !== key && key) {
    fn();
    prev.current = key;
  }
}

// мини-ref без useRef-импорта внутри (чтоб не плодить)
function useMemoRef<T>(value: T) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [ref] = useState<{ current: T | null }>({ current: null });
  return ref;
}
