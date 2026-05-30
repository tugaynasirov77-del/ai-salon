import { CalendarOff } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { IAppointment, IClient, AppointmentStatus } from '@shared/types';

interface Props {
  appointments: IAppointment[];
  clients: IClient[];
  loading?: boolean;
}

const STATUS: Record<AppointmentStatus, { color: string; label: string }> = {
  confirmed: { color: 'bg-green-500', label: 'Подтверждена' },
  completed: { color: 'bg-slate-400', label: 'Завершена' },
  cancelled: { color: 'bg-red-500', label: 'Отменена' },
  no_show: { color: 'bg-orange-500', label: 'Не пришёл' },
};

function fmtTime(d: Date | string) {
  const x = typeof d === 'string' ? new Date(d) : d;
  return x.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function AppointmentTimeline({ appointments, clients, loading }: Props) {
  // Только сегодняшние, отсортированные по времени
  const today = new Date().toDateString();
  const items = appointments
    .filter((a) => new Date(a.datetime).toDateString() === today)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Расписание на сегодня</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-3 w-3 mt-2 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <CalendarOff className="mb-3 h-10 w-10" />
            <div className="text-sm">Сегодня записей нет</div>
          </div>
        ) : (
          <ol className="relative space-y-5 border-l border-slate-200 pl-6 dark:border-slate-800">
            {items.map((a) => {
              const client = clients.find((c) => c.id === a.clientId);
              const s = STATUS[a.status];
              return (
                <li key={a.id} className="relative">
                  <span
                    className={cn(
                      'absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white dark:ring-[#1F232A]',
                      s.color,
                    )}
                  />
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm font-semibold text-[#1F232A] dark:text-slate-100">
                      {fmtTime(a.datetime)}
                    </span>
                    <span className="text-xs text-slate-400">{s.label}</span>
                  </div>
                  <div className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">
                    {client?.name || 'Клиент'} · {a.service}
                    {a.master && <span className="text-slate-400"> · {a.master}</span>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
