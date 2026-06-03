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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full overflow-hidden border border-white/[0.12] bg-black shadow-[0_24px_80px_-20px_rgba(0,0,0,0.9)]',
          WIDTH[maxWidth],
        )}
      >
        {title && (
          <header className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
            <h3 className="font-bebas text-[1.1rem] uppercase tracking-[0.04em] text-white">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="text-white/45 transition-colors hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
        )}
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer && <footer className="border-t border-white/[0.08] px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}
