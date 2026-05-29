import Link from 'next/link';
import { Logo } from '@/components/landing/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 -left-40 h-[520px] w-[520px] rounded-full bg-amber-600/25 blur-[140px]" />
        <div className="absolute top-[30%] -right-32 h-[480px] w-[480px] rounded-full bg-amber-600/20 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(217,146,32,0.08),transparent_60%)]" />
      </div>

      <header className="border-b border-white/[0.06] bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="inline-flex">
            <Logo size={30} variant="light" />
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-slate-300 transition-colors hover:text-white">
              Войти
            </Link>
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-amber-500 via-amber-500 to-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(217,146,32,0.35)]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Регистрация
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col px-4 py-12">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md shadow-[0_0_60px_rgba(217,146,32,0.08)] sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
