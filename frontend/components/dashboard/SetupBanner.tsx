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
    <div className="mb-5 rounded-2xl border border-[#3B82F6]/30 bg-gradient-to-br from-[#3B82F6]/15 via-[#3B82F6]/10 to-transparent p-5 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#38BDF8] to-[#2563EB] text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold text-white">Завершите настройку</div>
          <p className="mt-1 text-sm text-slate-300">
            Чтобы ИИ начал отвечать клиентам, подключите хотя бы один канал — Telegram, Авито или YClients. Займёт пару минут.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/onboarding"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#3B82F6] to-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.45)] transition-transform hover:scale-[1.02]"
            >
              Продолжить в визарде
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.08]"
            >
              Перейти в настройки
            </Link>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Скрыть"
          className="-mr-1 -mt-1 rounded-md p-1 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
