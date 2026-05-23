'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarCheck2, Wallet, Percent, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AppointmentTimeline } from '@/components/dashboard/AppointmentTimeline';
import { RecentConversations } from '@/components/dashboard/RecentConversations';
import { ByDayChart } from '@/components/dashboard/ByDayChart';
import { fetchAnalytics, fetchAppointments, fetchClients, fetchConversations } from '@/lib/api';
import { useSalonId } from '@/lib/config';

// Формат рубля: 1234567 → "1 234 567 ₽"
function fmtRub(n: number) {
  return n.toLocaleString('ru-RU') + ' ₽';
}

function isoToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function DashboardHome() {
  const SALON_ID = useSalonId();
  // Аналитика за последние 30 дней (дефолт бэка)
  const analytics = useQuery({ queryKey: ['analytics', SALON_ID, '30d'], queryFn: () => fetchAnalytics(SALON_ID) });

  // Записи на сегодня — отдельный запрос с from/to
  const today = isoToday();
  const appointments = useQuery({
    queryKey: ['appointments', SALON_ID, today],
    queryFn: () => fetchAppointments(SALON_ID, { from: today, to: today }),
  });

  const conversations = useQuery({ queryKey: ['conversations', SALON_ID], queryFn: () => fetchConversations(SALON_ID) });
  const clients = useQuery({ queryKey: ['clients', SALON_ID], queryFn: () => fetchClients(SALON_ID) });

  const a = analytics.data;

  return (
    <div>
      <PageHeader title="Главная" description="Сводка за последние 30 дней." />

      {/* Метрики */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Записей за период"
          value={a?.appointmentsInPeriod ?? '—'}
          icon={<CalendarCheck2 className="h-4 w-4" />}
          loading={analytics.isLoading}
        />
        <MetricCard
          label="Выручка"
          value={a ? fmtRub(a.revenue) : '—'}
          icon={<Wallet className="h-4 w-4" />}
          loading={analytics.isLoading}
        />
        <MetricCard
          label="Конверсия"
          value={a ? Math.round(a.conversion * 100) + '%' : '—'}
          icon={<Percent className="h-4 w-4" />}
          loading={analytics.isLoading}
        />
        <MetricCard
          label="Сообщений"
          value={a?.messagesInPeriod ?? '—'}
          icon={<MessageSquare className="h-4 w-4" />}
          loading={analytics.isLoading}
        />
      </div>

      {/* Две колонки: график + сегодняшние записи СЛЕВА, диалоги СПРАВА */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <ByDayChart data={a?.byDay || []} loading={analytics.isLoading} />
          <AppointmentTimeline
            appointments={appointments.data || []}
            clients={clients.data || []}
            loading={appointments.isLoading || clients.isLoading}
          />
        </div>
        <div className="lg:col-span-2">
          <RecentConversations
            items={conversations.data || []}
            loading={conversations.isLoading}
            limit={5}
          />
        </div>
      </div>
    </div>
  );
}
