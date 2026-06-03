'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

// SpaceX-стиль: rounded-full pills, UPPERCASE, blue solid / white outline
const variants: Record<Variant, string> = {
  primary:
    'bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-[0_0_0_1px_rgba(59,130,246,0.4),0_0_30px_-8px_rgba(59,130,246,0.7)] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.6),0_0_40px_-4px_rgba(59,130,246,0.9)] disabled:bg-white/[0.08] disabled:text-white/40 disabled:shadow-none',
  secondary:
    'border border-white/70 bg-transparent text-white hover:bg-white hover:text-black',
  ghost:
    'bg-transparent text-white/70 hover:text-white hover:bg-white/[0.06]',
  outline:
    'border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/30',
  danger:
    'border border-red-400/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:border-red-400/70',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[10px] tracking-[0.14em]',
  md: 'h-10 px-5 text-[11px] tracking-[0.14em]',
  lg: 'h-12 px-7 text-[12px] tracking-[0.14em]',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-bold uppercase transition-all disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
