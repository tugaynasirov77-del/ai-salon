'use client';

import { Check } from 'lucide-react';
import { NICHES } from '@shared/niches';
import type { NicheKey } from '@shared/types';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const ORDER: NicheKey[] = [
  'beauty_salon',
  'barbershop',
  'fitness',
  'clinic',
  'auto_service',
  'restaurant',
  'lawyer',
  'tutor',
  'other',
];

export function NichePicker() {
  const selected = useAppStore((s) => s.onboarding.niche);
  const setNiche = useAppStore((s) => s.setNiche);

  return (
    <div>
      <h2 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Чем вы занимаетесь?
      </h2>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Выберите нишу — мы настроим бота под ваш бизнес.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {ORDER.map((key) => {
          const niche = NICHES[key];
          const isSelected = selected === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setNiche(key)}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-xl border-2 bg-white p-6 text-center transition-all hover:border-blue-300 hover:shadow-sm dark:bg-slate-900',
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800',
              )}
            >
              {isSelected && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Check className="h-4 w-4" />
                </span>
              )}
              <span className="mb-2 text-4xl">{niche.icon}</span>
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {niche.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
