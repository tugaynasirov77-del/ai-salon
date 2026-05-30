import { Check, X, UserCircle2 } from 'lucide-react';
import { LogoMark } from './Logo';

interface Row {
  label: string;
  admin: 'yes' | 'no' | string;
  liva: 'yes' | 'no' | string;
}

const ROWS: Row[] = [
  { label: 'Отвечает клиенту 24/7', admin: 'no', liva: 'yes' },
  { label: 'Работает в выходные и праздники', admin: 'no', liva: 'yes' },
  { label: 'Не уходит в отпуск и не болеет', admin: 'no', liva: 'yes' },
  { label: 'Помнит каждого клиента и историю', admin: 'no', liva: 'yes' },
  { label: 'Отправляет напоминания за 24 и 2 часа', admin: 'no', liva: 'yes' },
  { label: 'Подбирает свободное окно и мастера', admin: 'yes', liva: 'yes' },
  { label: 'Принимает заявки в одно окно из всех каналов', admin: 'no', liva: 'yes' },
  { label: 'Считает выручку, конверсию, топ-услуги', admin: 'no', liva: 'yes' },
  { label: 'Эскалирует владельцу если не уверен', admin: '—', liva: 'yes' },
  { label: 'Стоимость в месяц', admin: 'от 35 000 ₽', liva: 'от 2 500 ₽' },
  { label: 'Время на подключение', admin: '2–4 недели поиска и обучения', liva: '15 минут' },
];

function Cell({ value, accent }: { value: Row['admin']; accent: 'admin' | 'liva' }) {
  if (value === 'yes') {
    return (
      <span
        className={
          accent === 'liva'
            ? 'inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30'
            : 'inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400/80'
        }
      >
        <Check className="h-4 w-4" />
      </span>
    );
  }
  if (value === 'no') {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500/10 text-red-400/80 ring-1 ring-inset ring-red-400/20">
        <X className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className={accent === 'liva' ? 'text-sm font-semibold text-white' : 'text-sm text-slate-300'}>
      {value}
    </span>
  );
}

export function ComparisonTable() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="reveal text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C0C4CB]">Сравнение</span>
          <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
            Администратор vs <br /> Liva ai
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Где AI закрывает то, на что у живого администратора не хватает рук, времени или возможностей.
          </p>
        </div>

        <div className="glass reveal mt-12 overflow-hidden rounded-2xl">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-white/[0.08] px-5 py-4 sm:gap-8 sm:px-8 sm:py-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Что важно</div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <UserCircle2 className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline">Живой администратор</span>
              <span className="sm:hidden">Админ.</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <LogoMark size={20} />
              <span className="bg-gradient-to-r from-[#C0C4CB] to-[#C0C4CB] bg-clip-text text-transparent">Liva ai</span>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.05]">
            {ROWS.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] sm:gap-8 sm:px-8"
              >
                <div className="text-sm text-slate-200">{row.label}</div>
                <div className="flex justify-end">
                  <Cell value={row.admin} accent="admin" />
                </div>
                <div className="flex justify-end">
                  <Cell value={row.liva} accent="liva" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-gradient reveal relative mt-10 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#8A8E96]/10 via-[#8A8E96]/10 to-[#5A5E66]/10 p-6 text-center backdrop-blur-sm sm:p-8">
          <p className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            В{' '}
            <span className="bg-gradient-to-r from-[#C0C4CB] via-[#C0C4CB] to-[#C0C4CB] bg-clip-text text-transparent">
              18 раз дешевле
            </span>{' '}
            и работает 24/7
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
            Один администратор стоит как 18 месяцев Liva ai. И всё равно не отвечает в выходные.
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Сравнение справедливо для типового салона/студии до 5 мастеров. Liva ai не заменяет живого человека там, где важен личный контакт (касса, конфликты, клининг).
        </p>
      </div>
    </section>
  );
}
