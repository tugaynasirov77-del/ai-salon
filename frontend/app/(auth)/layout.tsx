import Link from 'next/link';
import { Logo } from '@/components/landing/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <header className="border-b border-white/[0.08] bg-black">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="inline-flex">
            <Logo size={30} variant="dark" />
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-white"
            >
              Войти
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#3B82F6] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_0_1px_rgba(59,130,246,0.4),0_0_30px_-8px_rgba(59,130,246,0.7)] transition-all hover:bg-[#2563EB]"
            >
              Регистрация
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col px-4 py-12">
        <div className="border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
