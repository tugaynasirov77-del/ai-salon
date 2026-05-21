'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Props {
  data: Array<{ day: string; count: number }>;
  loading?: boolean;
}

export function ByDayChart({ data, loading }: Props) {
  // Короткий формат для оси X: '2026-05-21' → '21.05'
  const points = data.map((d) => ({ ...d, label: d.day.slice(8, 10) + '.' + d.day.slice(5, 7) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Записи по дням</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        ) : points.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
            Нет данных за период
          </div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 6, right: 6, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-slate-500" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'currentColor' }} className="text-slate-500" />
                <Tooltip
                  contentStyle={{ background: 'rgb(15 23 42)', border: 'none', borderRadius: 8, color: 'white' }}
                  labelStyle={{ color: 'rgb(148 163 184)' }}
                />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
