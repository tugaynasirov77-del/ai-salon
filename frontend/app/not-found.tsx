import Link from 'next/link';
import { ArrowRight, Home } from 'lucide-react';
import { Logo } from '@/components/landing/Logo';

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#181C24] text-slate-100">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 -left-40 h-[520px] w-[520px] rounded-full bg-amber-600/25 blur-[140px]" />
        <div className="absolute top-[30%] -right-32 h-[480px] w-[480px] rounded-full bg-amber-600/20 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.08),transparent_60%)]" />
      </div>

      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#181C24]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="inline-flex">
            <Logo size={30} variant="light" />
          </Link>
          <Link
            href="/"
            className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-[#3B82F6] via-[#3B82F6] to-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.35)]"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            На главную
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-24 pb-32 text-center sm:pt-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          Страница не найдена
        </div>

        <h1 className="mt-8 bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-7xl font-semibold tracking-tight text-transparent sm:text-9xl">
          404
        </h1>

        <p className="mx-auto mt-6 max-w-md text-lg text-slate-400">
          Похоже, такой страницы нет. Возможно, она была удалена или ссылка
          набрана с опечаткой.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#3B82F6] to-[#2563EB] px-7 py-3.5 text-base font-semibold text-white shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-transform hover:scale-[1.02]"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <Home className="h-4 w-4" />
            На главную
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-7 py-3.5 text-base font-medium text-slate-200 backdrop-blur transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            В админку
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-12 text-xs text-slate-500">
          Если думаете, что это ошибка — напишите{' '}
          <a href="mailto:hello@ailiva.ru" className="text-amber-300 hover:text-white">
            hello@ailiva.ru
          </a>
        </p>
      </main>
    </div>
  );
}
