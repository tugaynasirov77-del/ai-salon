'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarCheck2, UserPlus, MessageSquare, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AppointmentTimeline } from '@/components/dashboard/AppointmentTimeline';
import { RecentMessages } from '@/components/dashboard/RecentMessages';
import { fetchAnalytics, fetchAppointments, fetchClients, fetchMessages } from '@/lib/api';

const SALON_ID = 'mock-salon-1'; // TODO: брать из useAppStore когда Clerk подключим

export default function DashboardHome() {
  const analytics = useQuery({ queryKey: ['analytics', SALON_ID, '7d'], queryFn: () => fetchAnalytics(SALON_ID, '7d') });
  const appointments = useQuery({ queryKey: ['appointments', SALON_ID], queryFn: () => fetchAppointments(SALON_ID) });
  const messages = useQuery({ queryKey: ['messages', SALON_ID], queryFn: () => fetchMessages(SALON_ID) });
  const clients = useQuery({ queryKey: ['clients', SALON_ID], queryFn: () => fetchClients(SALON_ID) });

  const a = analytics.data;

  return (
    <div>
      <PageHeader title="Главная" description="Сводка по записям, клиентам и сообщениям." />

      {/* Метрики */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Записей сегодня"
          value={a?.bookingsToday ?? '—'}
          trend={12}
          icon={<CalendarCheck2 className="h-4 w-4" />}
          loading={analytics.isLoading}
        />
        <MetricCard
          label="Новых клиентов за неделю"
          value={a?.newClientsWeek ?? '—'}
          trend={8}
          icon={<UserPlus className="h-4 w-4" />}
          loading={analytics.isLoading}
        />
        <MetricCard
          label="Сообщений за сегодня"
          value={a?.messagesToday ?? '—'}
          trend={-3}
          icon={<MessageSquare className="h-4 w-4" />}
          loading={analytics.isLoading}
        />
        <MetricCard
          label="Конверсия в запись"
          value={a ? Math.round(a.conversionRate * 100) + '%' : '—'}
          trend={5}
          icon={<TrendingUp className="h-4 w-4" />}
          loading={analytics.isLoading}
        />
      </div>

      {/* Две колонки 60/40 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <AppointmentTimeline
            appointments={appointments.data || []}
            clients={clients.data || []}
            loading={appointments.isLoading || clients.isLoading}
          />
        </div>
        <div className="lg:col-span-2">
          <RecentMessages
            messages={messages.data || []}
            clients={clients.data || []}
            loading={messages.isLoading || clients.isLoading}
          />
        </div>
      </div>
    </div>
  );
}
