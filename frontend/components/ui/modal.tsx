'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
}

const WIDTH: Record<NonNullable<Props['maxWidth']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({ open, onClose, title, children, footer, maxWidth = 'md' }: Props) {
  // Esc закрывает
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#14181F]/70 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl',
          'dark:border-white/10 dark:bg-[#1E2329] dark:shadow-[0_0_60px_rgba(59,130,246,0.15)]',
          WIDTH[maxWidth],
        )}
      >
        {title && (
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/10">
            <h3 className="text-base font-semibold text-[#1E2329] dark:text-slate-100">{title}</h3>
            <button onClick={onClose} aria-label="Закрыть" className="text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </header>
        )}
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer && <footer className="border-t border-slate-100 px-5 py-3 dark:border-white/10">{footer}</footer>}
      </div>
    </div>
  );
}
