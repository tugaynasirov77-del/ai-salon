import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string | number;
  trend?: number;            // 12 → +12%, -5 → -5%
  icon?: React.ReactNode;
  loading?: boolean;
}

export function MetricCard({ label, value, trend, icon, loading }: Props) {
  if (loading) {
    return (
      <Card className="p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </Card>
    );
  }

  const TrendIcon = trend == null ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend == null
      ? ''
      : trend > 0
        ? 'text-green-600 dark:text-green-400'
        : trend < 0
          ? 'text-red-600 dark:text-red-400'
          : 'text-slate-400';

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-3xl font-bold text-[#232831] dark:text-slate-100">{value}</div>
        {TrendIcon && (
          <div className={cn('flex items-center gap-0.5 text-xs font-medium', trendColor)}>
            <TrendIcon className="h-3.5 w-3.5" />
            {Math.abs(trend!)}%
          </div>
        )}
      </div>
    </Card>
  );
}
