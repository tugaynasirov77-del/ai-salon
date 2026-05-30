import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Premium glass-стиль: тонкий border, subtle background, дефолтный p-5.
        // Переопределение через className (p-0 для таблиц, p-4 для плотных карточек) — tailwind-merge.
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm',
        'dark:border-white/[0.08] dark:bg-white/[0.025] dark:backdrop-blur-sm dark:shadow-none',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-slate-100 px-5 py-4 dark:border-slate-800', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold text-[#1A1612] dark:text-slate-100', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}
