'use client';

import { useEffect, useRef } from 'react';

/**
 * Магнитный курсор: синее размытое пятно следует за мышью с лёгким lag,
 * увеличивается над интерактивными элементами (a/button/[data-hover]).
 * Desktop-only (не вешается на touch-устройства). Уважает prefers-reduced-motion.
 *
 * Реализация: одна fixed-div + rAF цикл с lerp-сглаживанием, без re-render React.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Touch / mobile → не показываем
    if (window.matchMedia('(pointer: coarse)').matches) return;
    // a11y: пользователь выключил анимации
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = ref.current;
    if (!el) return;

    // Целевая (мышь) + текущая (отрисованная) позиция, для smooth-lag
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let cx = mx;
    let cy = my;
    let scale = 1;
    let targetScale = 1;
    let visible = false;
    let raf = 0;

    function onMove(e: MouseEvent) {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        // Первое движение → показываем (избегаем «мигания» в углу при загрузке)
        visible = true;
        el!.style.opacity = '1';
      }
      // Если курсор над интерактивом — увеличиваем
      const t = e.target as HTMLElement | null;
      const interactive = t?.closest('a, button, [role="button"], [data-hover]');
      targetScale = interactive ? 2.2 : 1;
    }

    function onLeave() {
      visible = false;
      el!.style.opacity = '0';
    }

    function tick() {
      // lerp 0.18 — компромисс между «прибит к курсору» и «лениво плывёт»
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      scale += (targetScale - scale) * 0.18;
      el!.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%) scale(${scale})`;
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100] h-[420px] w-[420px] rounded-full opacity-0 transition-opacity duration-300 will-change-transform"
      style={{
        background:
          'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0.08) 35%, transparent 65%)',
        mixBlendMode: 'screen',
      }}
    />
  );
}
