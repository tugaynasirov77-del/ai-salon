'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const baseField =
  'w-full border border-white/[0.12] bg-white/[0.04] text-sm text-white placeholder:text-white/35 ' +
  'focus:border-white/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 transition-colors';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(baseField, 'h-10 px-3', className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(baseField, 'min-h-[120px] px-3 py-2', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'mb-1.5 block text-[11px] font-medium uppercase tracking-[0.18em] text-white/55',
        className,
      )}
      {...props}
    />
  );
}
