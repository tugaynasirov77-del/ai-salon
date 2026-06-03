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
          <div className="h-48 animate-pulse bg-white/[0.04]" />
        ) : points.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
            Нет данных за период
          </div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 6, right: 6, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(255,255,255,0.15)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(255,255,255,0.15)" />
                <Tooltip
                  contentStyle={{ background: '#000', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 0, color: 'white' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.55)' }}
                />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
