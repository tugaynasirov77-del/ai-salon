'use client';

import { useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.ailiva.ru';
const DEMO_SALON_ID = 'cmpfhd7ha00001s7ud34xwfmw';
const FLAG = '__ailivaDemoWidgetLoaded';

/**
 * Загружает виджет демо-салона. widget.js полагается на `document.currentScript.src`
 * для извлечения salonId, и при динамической вставке через `<script src>` это
 * не всегда срабатывает (race с async-загрузкой). Поэтому грузим код через fetch,
 * вешаем фейковый <script> с нужным src и выполняем eval — currentScript указывает
 * на наш тег, скрипт корректно парсит salon из URL.
 */
export function DemoWidget() {
  useEffect(() => {
    const w = window as any;
    if (w[FLAG]) return;
    w[FLAG] = true;

    const url = `${API_BASE}/widget.js?salon=${DEMO_SALON_ID}`;
    fetch(url)
      .then((r) => r.text())
      .then((code) => {
        const fakeScript = document.createElement('script');
        fakeScript.src = url;
        document.head.appendChild(fakeScript);
        // Подменяем currentScript только на время выполнения
        const original = Object.getOwnPropertyDescriptor(Document.prototype, 'currentScript');
        Object.defineProperty(document, 'currentScript', {
          configurable: true,
          get: () => fakeScript,
        });
        try {
          // eslint-disable-next-line no-new-func
          new Function(code)();
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[demo-widget] eval error', e);
        } finally {
          if (original) {
            Object.defineProperty(document, 'currentScript', original);
          }
        }
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error('[demo-widget] fetch error', e);
      });
  }, []);
  return null;
}
