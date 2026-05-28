'use client';

import { useEffect, useRef, useState } from 'react';

// Считает число вверх (easeOutCubic) при первом появлении в вьюпорте.
// to — целевое значение, format — как отрисовать промежуточное число.
export function CountUp({
  to,
  duration = 1600,
  format,
  className,
}: {
  to: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVal(to);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || started.current) continue;
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(to * eased);
            if (p < 1) requestAnimationFrame(tick);
            else setVal(to);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  const display = format ? format(val) : Math.round(val).toLocaleString('ru-RU');
  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
