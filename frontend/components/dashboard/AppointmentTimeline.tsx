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
  confirmed: { color: 'bg-emerald-400', label: 'Подтверждена' },
  completed: { color: 'bg-white/40', label: 'Завершена' },
  cancelled: { color: 'bg-red-400', label: 'Отменена' },
  no_show: { color: 'bg-orange-400', label: 'Не пришёл' },
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
                <div className="mt-2 h-3 w-3 animate-pulse rounded-full bg-white/[0.08]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse bg-white/[0.08]" />
                  <div className="h-3 w-48 animate-pulse bg-white/[0.08]" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/35">
            <CalendarOff className="mb-3 h-10 w-10" />
            <div className="text-[11px] font-medium uppercase tracking-[0.18em]">Сегодня записей нет</div>
          </div>
        ) : (
          <ol className="relative space-y-5 border-l border-white/[0.08] pl-6">
            {items.map((a) => {
              const client = clients.find((c) => c.id === a.clientId);
              const s = STATUS[a.status];
              return (
                <li key={a.id} className="relative">
                  <span
                    className={cn(
                      'absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ring-4 ring-black',
                      s.color,
                    )}
                  />
                  <div className="flex items-baseline gap-3">
                    <span className="font-bebas text-[1.1rem] uppercase tracking-[0.04em] text-white">
                      {fmtTime(a.datetime)}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">{s.label}</span>
                  </div>
                  <div className="mt-1 text-sm text-white/70">
                    {client?.name || 'Клиент'} · {a.service}
                    {a.master && <span className="text-white/40"> · {a.master}</span>}
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
