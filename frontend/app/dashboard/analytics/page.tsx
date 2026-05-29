'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Users, Calendar, TrendingUp, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { fetchAnalytics } from '@/lib/api';
import { useSalonId } from '@/lib/config';
import { cn } from '@/lib/utils';
import type { Channel } from '@shared/types';

type PeriodDays = 7 | 30 | 90;

function rangeFor(days: PeriodDays) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days + 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

const PERIODS: Array<{ days: PeriodDays; label: string }> = [
  { days: 7, label: '7 дней' },
  { days: 30, label: '30 дней' },
  { days: 90, label: '90 дней' },
];

const CHANNEL_LABEL: Record<Channel, string> = {
  telegram: 'Telegram',
  max: 'MAX',
  vk: 'ВКонтакте',
  sms: 'SMS',
  webchat: 'Веб-чат',
  avito: 'Авито',
};
const CHANNEL_COLOR: Record<Channel, string> = {
  telegram: '#3b82f6',
  max: '#a855f7',
  vk: '#0ea5e9',
  sms: '#64748b',
  webchat: '#10b981',
  avito: '#f97316',
};

function fmtMoney(n: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽';
}

function fmtDay(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}`;
}

export default function AnalyticsPage() {
  const SALON_ID = useSalonId();
  const [period, setPeriod] = useState<PeriodDays>(30);
  const range = useMemo(() => rangeFor(period), [period]);

  const analytics = useQuery({
    queryKey: ['analytics', SALON_ID, range.from, range.to],
    queryFn: () => fetchAnalytics(SALON_ID, range),
  });

  // Топ-5 услуг и источники приходят с бэка готовыми
  const topServices = analytics.data?.topServices || [];
  const channelBreakdown = useMemo(() => {
    return (analytics.data?.channelSources || []).map((s) => {
      const ch = s.channel as Channel;
      return { channel: ch, name: CHANNEL_LABEL[ch] || s.channel, value: s.count };
    });
  }, [analytics.data?.channelSources]);

  // byDay в формате с подписями + 0 для дней без записей
  const byDayChart = useMemo(() => {
    const map = new Map<string, number>();
    (analytics.data?.byDay || []).forEach((d) => map.set(d.day, d.count));
    // дополним пропущенные дни нулями
    const out: Array<{ day: string; label: string; count: number }> = [];
    const start = new Date(range.from);
    const end = new Date(range.to);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      out.push({ day: iso, label: fmtDay(iso), count: map.get(iso) || 0 });
    }
    return out;
  }, [analytics.data?.byDay, range.from, range.to]);

  const a = analytics.data;
  const loading = analytics.isLoading;
  const totalChannels = channelBreakdown.reduce((s, c) => s + c.value, 0);

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <PageHeader title="Аналитика" description="Метрики работы ИИ-администратора за выбранный период." />
        <div className="flex gap-1 rounded-lg border border-slate-200 p-1 dark:border-slate-800">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              className={cn(
                'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                period === p.days
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          loading={loading}
          label="Записей"
          value={a?.appointmentsInPeriod ?? 0}
          icon={<Calendar className="h-4 w-4" />}
        />
        <MetricCard
          loading={loading}
          label="Выручка"
          value={a ? fmtMoney(a.revenue) : '—'}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          loading={loading}
          label="Конверсия"
          value={a ? `${Math.round((a.conversion || 0) * 100)}%` : '—'}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          loading={loading}
          label="Сообщений"
          value={a?.messagesInPeriod ?? 0}
          icon={<MessageSquare className="h-4 w-4" />}
        />
      </div>

      {/* График по дням */}
      <Card className="mb-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Записи по дням</h3>
        {loading ? (
          <div className="py-12"><LoadingSpinner /></div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byDayChart} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  labelFormatter={(label) => `${label}`}
                  formatter={(v: number) => [v, 'Записей']}
                />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Топ-5 услуг */}
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Топ-5 услуг</h3>
          {loading ? (
            <div className="py-12"><LoadingSpinner /></div>
          ) : topServices.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">Нет записей за период</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topServices}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: number) => [v, 'Записей']}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Pie каналов */}
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Источники клиентов</h3>
          {loading ? (
            <div className="py-12"><LoadingSpinner /></div>
          ) : totalChannels === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">Нет данных по источникам</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                    label={({ percent }) => `${Math.round((percent || 0) * 100)}%`}
                    labelLine={false}
                  >
                    {channelBreakdown.map((c) => (
                      <Cell key={c.channel} fill={CHANNEL_COLOR[c.channel] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: number, n: string) => [`${v} клиентов`, n]}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}
