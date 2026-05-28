'use client';

import { useEffect, useRef, useState } from 'react';

// Плавно «докручивает» число к новому value при каждом изменении (easeOutCubic).
// В отличие от CountUp анимирует не один раз на появлении, а на каждый апдейт —
// для калькулятора, где значение меняется при движении ползунка.
export function AnimatedNumber({
  value,
  format,
  duration = 450,
  className,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }

    const from = displayRef.current;
    if (from === value) return;
    const start = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = from + (value - from) * eased;
      displayRef.current = cur;
      setDisplay(cur);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        displayRef.current = value;
        setDisplay(value);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
