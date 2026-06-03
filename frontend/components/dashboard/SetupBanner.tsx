'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';

// Баннер «Завершите настройку» на главной дашборда.
// Показывается, если у салона не подключён ни один канал (TG/MAX/Avito/YClients).
// Скрывается на сессию через sessionStorage (вернётся после релоада, если не подключили).
export function SetupBanner() {
  const salon = useAuthStore((s) => s.salon);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('liva_setup_banner_hidden') === '1') setHidden(true);
  }, []);

  if (!salon || hidden) return null;

  const connected =
    !!salon.telegramBotToken ||
    !!salon.maxBotToken ||
    !!salon.avitoClientId ||
    !!salon.yclientsCompanyId;

  if (connected) return null;

  function dismiss() {
    sessionStorage.setItem('liva_setup_banner_hidden', '1');
    setHidden(true);
  }

  return (
    <div className="mb-6 border border-[#3B82F6]/40 bg-[#3B82F6]/[0.06] p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#3B82F6]/60 bg-[#3B82F6]/15 text-[#60A5FA]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#60A5FA]">— Действие</div>
          <div className="font-bebas mt-1 text-[1.5rem] uppercase tracking-[0.04em] text-white">Завершите настройку</div>
          <p className="mt-2 text-sm text-white/70">
            Чтобы ИИ начал отвечать клиентам, подключите хотя бы один канал — Telegram, Авито или YClients. Займёт пару минут.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/onboarding"
              className="inline-flex items-center gap-2 rounded-full bg-[#3B82F6] px-5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_0_1px_rgba(59,130,246,0.4),0_0_30px_-8px_rgba(59,130,246,0.7)] hover:bg-[#2563EB]"
            >
              Продолжить в визарде
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-transparent px-5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-white hover:text-black"
            >
              В настройки
            </Link>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Скрыть"
          className="-mr-1 -mt-1 p-1 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
