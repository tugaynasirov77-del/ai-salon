'use client';

import { useEffect } from 'react';

/**
 * Один rAF-цикл обновляет CSS-переменную --p для всех `.parallax-slow`
 * элементов на странице. --p ∈ [-1, 1]: -1 элемент только вошёл снизу,
 * 0 в центре viewport, 1 уходит вверх. Используется в globals.css
 * для лёгкого translateY-параллакса заголовков секций.
 *
 * Уважает prefers-reduced-motion (не запускает rAF). Никаких re-render
 * React, никаких scroll-listener'ов — один rAF cycle.
 */
export function SectionParallax() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let els: HTMLElement[] = [];

    function refresh() {
      els = Array.from(document.querySelectorAll<HTMLElement>('.parallax-slow'));
    }

    function tick() {
      const vh = window.innerHeight;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        // Центр элемента относительно viewport: 0 = center, ±1 = edge
        const center = r.top + r.height / 2;
        const p = (center - vh / 2) / vh;
        // Clamp [-1.2, 1.2] чтобы движение не уходило слишком далеко
        const clamped = Math.max(-1.2, Math.min(1.2, p));
        el.style.setProperty('--p', String(clamped.toFixed(3)));
      }
      raf = requestAnimationFrame(tick);
    }

    refresh();
    raf = requestAnimationFrame(tick);

    // Подхватим элементы, появившиеся после mount (HMR, lazy mount)
    const mo = new MutationObserver(refresh);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
    };
  }, []);

  return null;
}
