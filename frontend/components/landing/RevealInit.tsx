'use client';

import { useEffect } from 'react';

/**
 * Навешивает плавное появление на все элементы с классом .reveal
 * по мере прокрутки. Один IntersectionObserver на страницу.
 * При prefers-reduced-motion CSS сразу показывает элементы (см. globals.css).
 */
export function RevealInit() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    const els = document.querySelectorAll('.reveal:not(.is-visible)');
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
