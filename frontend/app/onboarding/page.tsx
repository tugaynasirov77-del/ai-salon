'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { NichePicker } from '@/components/onboarding/NichePicker';
import { BusinessForm, isBusinessFormValid } from '@/components/onboarding/BusinessForm';
import { ServicesForm } from '@/components/onboarding/ServicesForm';
import { ConnectBot } from '@/components/onboarding/ConnectBot';
import { createSalon } from '@/lib/api';
import { cn } from '@/lib/utils';

const STEPS = [
  { num: 1, label: 'Ниша' },
  { num: 2, label: 'Бизнес' },
  { num: 3, label: 'Услуги' },
  { num: 4, label: 'Telegram' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { step, niche, businessData } = useAppStore((s) => s.onboarding);
  const nextStep = useAppStore((s) => s.nextStep);
  const prevStep = useAppStore((s) => s.prevStep);
  const setSalon = useAppStore((s) => s.setSalon);
  const [submitting, setSubmitting] = useState(false);

  const canProceed =
    (step === 1 && !!niche) ||
    (step === 2 && isBusinessFormValid(businessData)) ||
    (step === 3 && (businessData.priceList || '').trim().length > 0) ||
    (step === 4 && !!businessData.telegramConnected);

  async function finish() {
    if (!niche) return;
    setSubmitting(true);
    try {
      const salon = await createSalon({
        niche,
        name: businessData.name,
        ownerName: businessData.ownerName,
        phone: businessData.phone,
        address: businessData.address,
      });
      setSalon(salon);
      router.push('/');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-600">
            Настройка
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Запустим вашего бота
          </h1>
        </header>

        {/* Прогресс-бар */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex flex-1 items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                    step >= s.num
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-800',
                  )}
                >
                  {s.num}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'mx-2 h-1 flex-1 rounded-full transition-colors',
                      step > s.num ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800',
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            {STEPS.map((s) => (
              <span key={s.num} className={cn(step === s.num && 'font-semibold text-blue-600')}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {step === 1 && <NichePicker />}
          {step === 2 && <BusinessForm />}
          {step === 3 && <ServicesForm />}
          {step === 4 && <ConnectBot />}
        </section>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={prevStep} disabled={step === 1}>
            <ChevronLeft className="h-4 w-4" />
            Назад
          </Button>
          {step < 4 ? (
            <Button onClick={nextStep} disabled={!canProceed}>
              Далее
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={!canProceed || submitting} size="lg">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Сохраняем…
                </>
              ) : (
                'Открыть дашборд'
              )}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
