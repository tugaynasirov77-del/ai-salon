'use client';

import { cn } from '@/lib/utils';

// Базовый skeleton-блок с pulse-анимацией. Цвет/радиус наследуем от родителя
// или задаём через className. Респектит prefers-reduced-motion (animate-pulse
// автоматически отключается в браузере при reduce).
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-white/[0.06]', className)} />;
}

// Готовый skeleton для строк таблицы / карточек списка.
// Используется на /dashboard/services, /masters, /clients, /faq.
export function ListSkeleton({ rows = 5, withAvatar }: { rows?: number; withAvatar?: boolean }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
        >
          {withAvatar && <Skeleton className="h-9 w-9 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}

// Skeleton для recharts-графиков. Имитирует форму, чтобы layout не прыгал.
// variant: 'line' — оси + ломаная-плейсхолдер; 'bar' — горизонтальные бары;
// 'pie' — кольцо + легенда.
export function ChartSkeleton({
  variant = 'line',
  height = 256,
}: {
  variant?: 'line' | 'bar' | 'pie';
  height?: number;
}) {
  if (variant === 'bar') {
    return (
      <div style={{ height }} className="flex flex-col justify-center gap-2.5 py-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton
              className="h-5 rounded-r-md"
              // Псевдо-рандомная ширина по индексу, чтобы бары выглядели разнокалиберно
              {...{ style: { width: `${88 - i * 14}%` } }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'pie') {
    return (
      <div style={{ height }} className="flex items-center justify-center gap-6">
        <div className="relative h-36 w-36">
          <Skeleton className="absolute inset-0 rounded-full" />
          <div className="absolute inset-[22%] rounded-full bg-[#12151C]" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // line
  return (
    <div style={{ height }} className="flex gap-3 py-2">
      <div className="flex flex-col justify-between py-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-2 w-6" />
        ))}
      </div>
      <div className="relative flex-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-px bg-white/[0.04]"
            style={{ top: `${(i + 1) * 20}%` }}
          />
        ))}
        <svg
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full animate-pulse"
          aria-hidden
        >
          <path
            d="M0,30 L15,22 L30,26 L45,14 L60,18 L75,8 L90,12 L100,6"
            fill="none"
            stroke="rgb(255 255 255 / 0.12)"
            strokeWidth="1.5"
          />
        </svg>
        <div className="absolute -bottom-1 left-0 right-0 flex justify-between">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-2 w-6" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton для grid-карточек (мастера, услуги в карточном виде).
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
