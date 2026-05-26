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
// Override-стили: на лендинге Tailwind/dark scheme делает input полупрозрачным
// или с белым цветом текста — текст в виджете не видно. Заставляем явные цвета.
const OVERRIDE_CSS = `
  .ailiva-input { color: #0f172a !important; background: #fff !important; -webkit-text-fill-color: #0f172a !important; }
  .ailiva-input::placeholder { color: #94a3b8 !important; opacity: 1 !important; }
  .ailiva-msg.in { color: #0f172a !important; background: #ffffff !important; }
  .ailiva-msgs { background: #f7f7f9 !important; }
  .ailiva-form { background: #ffffff !important; border-top-color: #eee !important; }
  .ailiva-panel { background: #ffffff !important; color: #0f172a !important; }
`;

function removeWidget() {
  document.querySelectorAll('.ailiva-btn, .ailiva-panel').forEach((el) => el.remove());
  document.getElementById('ailiva-demo-override')?.remove();
  delete (window as any)[FLAG];
}

export function DemoWidget() {
  useEffect(() => {
    const w = window as any;
    if (w[FLAG]) return;
    w[FLAG] = true;

    // Стиль-override ставим один раз, до загрузки скрипта — чтобы overwrite дефолтных правил из widget.js
    if (!document.getElementById('ailiva-demo-override')) {
      const style = document.createElement('style');
      style.id = 'ailiva-demo-override';
      style.textContent = OVERRIDE_CSS;
      document.head.appendChild(style);
    }

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

    // Cleanup при размонтировании (например при переходе с лендинга на /login через client-side роутинг).
    // Виджет вставляет кнопку и панель в document.body — без очистки они «прилипают» к следующей странице.
    return removeWidget;
  }, []);
  return null;
}
