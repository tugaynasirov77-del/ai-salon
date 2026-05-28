'use client';

import { useRef, useState } from 'react';

// Мягкий 3D-наклон карточки за курсором (как Hero-мокап, но деликатнее).
export function TiltCard({
  children,
  className = '',
  max = 6,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -py * max, ry: px * max });
  }
  function onLeave() {
    setTilt({ rx: 0, ry: 0 });
  }

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={className} style={{ perspective: '1000px' }}>
      <div
        className="h-full transition-transform duration-200 ease-out will-change-transform"
        style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`, transformStyle: 'preserve-3d' }}
      >
        {children}
      </div>
    </div>
  );
}
