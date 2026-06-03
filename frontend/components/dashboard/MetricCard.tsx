import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string | number;
  trend?: number;
  icon?: React.ReactNode;
  loading?: boolean;
}

export function MetricCard({ label, value, trend, icon, loading }: Props) {
  if (loading) {
    return (
      <Card className="p-5">
        <div className="h-3 w-24 animate-pulse bg-white/[0.08]" />
        <div className="mt-4 h-10 w-24 animate-pulse bg-white/[0.08]" />
      </Card>
    );
  }

  const TrendIcon = trend == null ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend == null
      ? ''
      : trend > 0
        ? 'text-emerald-400'
        : trend < 0
          ? 'text-red-400'
          : 'text-white/40';

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">{label}</div>
        {icon && <div className="text-white/40">{icon}</div>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="font-bebas text-[2.5rem] uppercase leading-[1] tracking-[0.04em] text-white">{value}</div>
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
