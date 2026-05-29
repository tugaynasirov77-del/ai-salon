'use client';

import { useEffect, useRef } from 'react';

// Тонкий градиентный индикатор прогресса скролла сверху (Linear/revone-стиль).
// На scroll-событии (без requestAnimationFrame) — обновляет scaleX напрямую.
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? Math.min(doc.scrollTop / max, 1) : 0;
      el.style.transform = `scaleX(${p})`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5">
      <div
        ref={ref}
        className="h-full origin-left bg-gradient-to-r from-[#E6C480] via-[#CFA049] to-[#A9742E] shadow-[0_0_12px_rgba(207,160,73,0.6)]"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}
