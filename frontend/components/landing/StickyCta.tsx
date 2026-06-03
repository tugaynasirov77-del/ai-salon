'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { LogoMark } from './Logo';
import { track } from '@/lib/analytics';

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
      <div className="pointer-events-auto relative flex w-full max-w-3xl items-center gap-3 rounded-2xl border border-white/[0.12] bg-black/40 px-4 py-2.5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur-md sm:gap-4 sm:rounded-full sm:px-5 sm:py-3">
        <div className="flex shrink-0 items-center gap-3">
          <LogoMark size={28} />
          <div className="hidden leading-tight sm:block">
            <div className="font-bebas text-[15px] uppercase tracking-[0.08em] text-white">Готовы попробовать?</div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">Запуск за 15 минут</div>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="#pricing"
            onClick={() => track('cta_pricing_anchor', { location: 'sticky' })}
            className="hidden items-center justify-center rounded-full border border-white/70 bg-transparent px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white hover:text-black sm:inline-flex"
          >
            Тарифы
          </Link>
          <Link
            href="/register"
            onClick={() => track('cta_register', { location: 'sticky' })}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#3B82F6] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_0_1px_rgba(59,130,246,0.4),0_0_30px_-8px_rgba(59,130,246,0.7)] transition-all hover:bg-[#2563EB]"
          >
            Начать
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
