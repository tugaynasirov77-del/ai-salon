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
    // Threshold 0 + rootMargin 0 = срабатывает в момент когда любой пиксель
    // элемента появляется в viewport. Раньше threshold 0.12 + negative bottom
    // margin создавали race condition для секций, появляющихся одновременно
    // с монтированием observer'а — секция повисала в opacity:0.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0, rootMargin: '0px' },
    );

    function attach() {
      const els = document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)');
      els.forEach((el) => {
        // Если элемент УЖЕ в viewport на момент монтирования — показать сразу,
        // не ждать первого callback'а observer'а (он async).
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          el.classList.add('is-visible');
        } else {
          observer.observe(el);
        }
      });
    }

    attach();
    // Подхватим элементы, добавленные после первого рендера (HMR / lazy mounts).
    const mo = new MutationObserver(() => attach());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
