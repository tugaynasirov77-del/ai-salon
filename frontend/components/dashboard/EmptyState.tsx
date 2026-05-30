'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Универсальный empty-state для пустых списков в дашборде:
// иконка + заголовок + объяснение + кнопка действия. Пустой экран = упущенный шанс
// сориентировать пользователя.
export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  text?: string;
  action?: { label: string; onClick?: () => void; href?: string };
}) {
  const btnCls =
    'mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#3B82F6] to-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.4)] transition-transform hover:scale-[1.02]';

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center backdrop-blur-sm">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#38BDF8]/15 to-[#3B82F6]/15 text-[#38BDF8] ring-1 ring-inset ring-white/10">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {text && <p className="mt-2 max-w-sm text-sm text-slate-400">{text}</p>}
      {action &&
        (action.href ? (
          <Link href={action.href} className={btnCls}>
            {action.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <button onClick={action.onClick} className={btnCls}>
            {action.label}
            <ArrowRight className="h-4 w-4" />
          </button>
        ))}
    </div>
  );
}
