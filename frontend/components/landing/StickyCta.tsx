'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { LogoMark } from './Logo';

/**
 * Появляется после ~600px скролла. Скрывается при достижении футера.
 * Без крестика — это конверсионный элемент, постоянно доступен в пределах
 * скролла. Старый ключ liva_sticky_cta_dismissed_v1 в localStorage больше
 * не используется (можно почистить вручную, но не обязательно).
 */
export function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Чистим устаревший флаг dismiss, если он остался у пользователя
    try { localStorage.removeItem('liva_sticky_cta_dismissed_v1'); } catch { /* ignore */ }
    function onScroll() {
      const y = window.scrollY;
      // Скрываем, если у самого верха или возле футера
      const nearBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 400;
      setVisible(y > 600 && !nearBottom);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={
        'pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 transition-all duration-500 sm:bottom-6 ' +
        (visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0')
      }
    >
      <div className="pointer-events-auto relative flex w-full max-w-3xl items-center gap-3 overflow-hidden rounded-2xl border border-white/15 bg-slate-900/85 px-4 py-2.5 shadow-[0_20px_60px_-10px_rgba(99,102,241,0.5)] backdrop-blur-xl sm:gap-4 sm:px-5 sm:py-3">
        <span className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
        <div className="flex shrink-0 items-center gap-2.5">
          <LogoMark size={32} />
          <div className="hidden text-xs leading-tight sm:block">
            <div className="font-semibold text-white">Готовы попробовать?</div>
            <div className="text-slate-400">Запуск за 15 минут</div>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="#pricing"
            className="hidden rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/[0.08] sm:inline-flex"
          >
            Тарифы
          </Link>
          <Link
            href="/register"
            className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-3.5 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] sm:px-4 sm:text-sm"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            Начать бесплатно
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
