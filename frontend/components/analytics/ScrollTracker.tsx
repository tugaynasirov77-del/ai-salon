'use client';

import { useEffect } from 'react';
import { track, analyticsEnabled } from '@/lib/analytics';

/**
 * Отслеживает глубину прокрутки лендинга и просмотры ключевых секций.
 * Каждое событие шлётся не более одного раза за загрузку страницы.
 *
 * - scroll_depth: meta.percent = 25 | 50 | 75 | 100
 * - section_view: meta.section = id секции (pricing, faq, demo, ...)
 *
 * Ничего не делает, если аналитика выключена (нет Supabase ENV).
 */
const DEPTH_MILESTONES = [25, 50, 75, 100];

// Секции, до которых важно знать, что посетитель доскроллил
const TRACKED_SECTIONS = ['demo', 'features', 'how', 'pricing', 'faq'];

export function ScrollTracker() {
  useEffect(() => {
    if (!analyticsEnabled) return;

    const firedDepth = new Set<number>();
    const firedSections = new Set<string>();

    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      if (scrollable <= 0) return;
      const percent = Math.round((window.scrollY / scrollable) * 100);
      for (const m of DEPTH_MILESTONES) {
        if (percent >= m && !firedDepth.has(m)) {
          firedDepth.add(m);
          track('scroll_depth', { percent: m });
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Просмотры секций через IntersectionObserver
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const id = entry.target.id;
              if (id && !firedSections.has(id)) {
                firedSections.add(id);
                track('section_view', { section: id });
              }
            }
          }
        },
        { threshold: 0.4 }, // секция видна минимум на 40%
      );
      for (const id of TRACKED_SECTIONS) {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      }
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      observer?.disconnect();
    };
  }, []);

  return null;
}
