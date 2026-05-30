'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-[#3B82F6] via-[#3B82F6] to-[#2563EB] text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:shadow-[0_0_28px_rgba(59,130,246,0.5)] hover:scale-[1.01] disabled:from-slate-500 disabled:via-slate-500 disabled:to-slate-500 disabled:shadow-none',
  secondary: 'bg-slate-100 text-[#181B22] hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.1]',
  ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.06]',
  outline: 'border border-slate-300 bg-transparent hover:bg-slate-50 dark:border-white/15 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
