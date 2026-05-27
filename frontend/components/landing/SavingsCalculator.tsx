'use client';

import { useMemo, useState } from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';

const LIVA_PRICE = 2_500; // ₽/мес тариф Self-Start

function fmtMoney(n: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽';
}

export function SavingsCalculator() {
  // Дефолты — реалистичные для регионов / Москвы
  const [salary, setSalary] = useState(45_000); // ЗП администратора
  const [missedPerWeek, setMissedPerWeek] = useState(8); // упущенных заявок в неделю
  const [avgCheck, setAvgCheck] = useState(2_500); // средний чек

  // Расчёты
  const monthlyMissedRevenue = useMemo(() => missedPerWeek * 4 * avgCheck, [missedPerWeek, avgCheck]);
  const monthlySalarySavings = useMemo(() => Math.max(0, salary - LIVA_PRICE), [salary]);
  const totalMonthlySavings = monthlySalarySavings + monthlyMissedRevenue;
  const yearlySavings = totalMonthlySavings * 12;

  return (
    <section id="savings" className="relative py-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Калькулятор</span>
          <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
            Посчитайте, сколько вы<br /> экономите в месяц
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Подвиньте ползунки под свой бизнес — увидите экономию в месяц и за год.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Inputs */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 backdrop-blur-sm sm:p-8">
            <h3 className="text-base font-semibold text-white">Параметры вашего бизнеса</h3>

            <Slider
              label="Зарплата администратора, ₽/мес"
              value={salary}
              onChange={setSalary}
              min={25_000}
              max={120_000}
              step={1_000}
              format={fmtMoney}
            />
            <Slider
              label="Упущенных заявок в неделю (звонки в нерабочее время, неотвеченные сообщения)"
              value={missedPerWeek}
              onChange={setMissedPerWeek}
              min={0}
              max={30}
              step={1}
              format={(v) => `${v} заявок`}
            />
            <Slider
              label="Средний чек, ₽"
              value={avgCheck}
              onChange={setAvgCheck}
              min={500}
              max={20_000}
              step={500}
              format={fmtMoney}
            />
          </div>

          {/* Results */}
          <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-indigo-900/40 via-violet-900/30 to-fuchsia-900/30 p-6 backdrop-blur-sm sm:p-8">
            <div className="absolute -top-20 right-0 h-[200px] w-[200px] rounded-full bg-fuchsia-500/30 blur-[80px]" />
            <div className="relative">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                Ваша экономия
              </div>

              <div className="mt-6">
                <div className="text-xs uppercase tracking-wider text-slate-400">в месяц</div>
                <div className="mt-1 bg-gradient-to-r from-emerald-300 via-emerald-200 to-white bg-clip-text text-5xl font-semibold text-transparent sm:text-6xl">
                  {fmtMoney(totalMonthlySavings)}
                </div>
              </div>

              <div className="mt-6 space-y-3 border-t border-white/10 pt-6 text-sm">
                <Row label="Зарплата без AI" value={fmtMoney(salary)} muted />
                <Row label="Тариф Liva ai" value={`− ${fmtMoney(LIVA_PRICE)}`} accent="emerald" />
                <Row
                  label="Возвращённая выручка с упущенных заявок"
                  value={`+ ${fmtMoney(monthlyMissedRevenue)}`}
                  accent="emerald"
                  hint="Считаем что AI ловит 100% обращений в нерабочее время"
                />
              </div>

              <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  За год
                </div>
                <div className="text-xl font-semibold text-white">
                  {fmtMoney(yearlySavings)}
                </div>
              </div>

              <p className="mt-4 text-[11px] text-slate-400">
                Расчёт — ориентир, не публичная оферта. AI не заменяет всю работу администратора (касса,
                клининг и т.п.), но закрывает приём заявок и запись на услугу в большинстве ниш.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-end justify-between gap-3">
        <label className="text-xs leading-snug text-slate-400">{label}</label>
        <div className="shrink-0 rounded-md bg-white/[0.06] px-2.5 py-1 text-sm font-semibold text-white">
          {format(value)}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-violet-500"
        style={{
          background: `linear-gradient(to right, #8b5cf6 0%, #d946ef ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%)`,
        }}
      />
    </div>
  );
}

function Row({ label, value, muted, accent, hint }: { label: string; value: string; muted?: boolean; accent?: 'emerald'; hint?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className={`text-sm ${muted ? 'text-slate-400' : 'text-slate-200'}`}>{label}</div>
        <div className={`font-semibold ${accent === 'emerald' ? 'text-emerald-300' : 'text-white'}`}>{value}</div>
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div>}
    </div>
  );
}
