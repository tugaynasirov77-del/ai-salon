'use client';

import { useEffect, useRef } from 'react';

// Браузерные уведомления + короткий звук при появлении новых непрочитанных сообщений.
// Получает текущий unreadTotal извне; реагирует на УВЕЛИЧЕНИЕ счётчика.
// Permission запрашивается лениво при первом росте (не на загрузке).
export function NotificationManager({ unreadTotal }: { unreadTotal: number }) {
  const prev = useRef<number | null>(null);
  const askedRef = useRef(false);

  useEffect(() => {
    // Первая фиксация (после загрузки) — не считаем «новым».
    if (prev.current === null) {
      prev.current = unreadTotal;
      return;
    }
    if (unreadTotal > prev.current) {
      const delta = unreadTotal - prev.current;
      beep();
      pushNotification(unreadTotal, delta, askedRef);
    }
    prev.current = unreadTotal;
  }, [unreadTotal]);

  return null;
}

function beep() {
  try {
    const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1175, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.16, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
    osc.onended = () => ctx.close().catch(() => {});
  } catch {
    // браузер заблокировал AudioContext без user gesture — молча игнорим.
  }
}

function pushNotification(total: number, delta: number, askedRef: React.MutableRefObject<boolean>) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
  if (document.visibilityState === 'visible' && document.hasFocus()) {
    // Вкладка активна — звук уже сыграл, лишний Notification не нужен.
    return;
  }
  if (Notification.permission === 'granted') {
    try {
      new Notification('Новое сообщение в Liva ai', {
        body: delta === 1 ? '1 непрочитанное сообщение' : `${delta} новых сообщений · всего ${total}`,
        icon: '/brand/liva-flame.svg',
        tag: 'liva-new-message',
      });
    } catch {
      // silent
    }
  } else if (Notification.permission === 'default' && !askedRef.current) {
    askedRef.current = true;
    Notification.requestPermission().catch(() => {});
  }
}
