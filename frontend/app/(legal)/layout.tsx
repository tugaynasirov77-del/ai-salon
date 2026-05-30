import Link from 'next/link';
import { Logo } from '@/components/landing/Logo';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0E121A] text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 -left-40 h-[520px] w-[520px] rounded-full bg-amber-600/15 blur-[140px]" />
        <div className="absolute top-[40%] -right-32 h-[480px] w-[480px] rounded-full bg-amber-600/10 blur-[140px]" />
      </div>

      <header className="border-b border-white/[0.06] bg-[#0E121A]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="inline-flex">
            <Logo size={28} variant="light" />
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <Link href="/privacy" className="hover:text-white">Конфиденциальность</Link>
            <Link href="/terms" className="hover:text-white">Оферта</Link>
            <Link href="/" className="hover:text-white">На главную</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <article className="legal-doc">{children}</article>
      </main>

      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto max-w-4xl px-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Liva ai · <Link href="/" className="hover:text-white">ailiva.ru</Link> · <a href="mailto:hello@ailiva.ru" className="hover:text-white">hello@ailiva.ru</a>
        </div>
      </footer>

      {/* Локальные стили для legal-документов — заменяют @tailwindcss/typography */}
      <style>{`
        .legal-doc h1 { background-image: linear-gradient(to bottom, white, rgba(255,255,255,0.6)); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 600; letter-spacing: -0.025em; line-height: 1.1; }
        .legal-doc h2 { color: white; font-weight: 600; font-size: 1.5rem; margin-top: 2.5rem; margin-bottom: 1rem; letter-spacing: -0.01em; }
        .legal-doc p { color: rgb(203 213 225); margin-top: 1rem; margin-bottom: 1rem; line-height: 1.65; }
        .legal-doc ul { color: rgb(203 213 225); margin-top: 1rem; margin-bottom: 1rem; padding-left: 1.5rem; list-style: disc; }
        .legal-doc li { margin-top: 0.5rem; line-height: 1.6; }
        .legal-doc li::marker { color: rgb(139 92 246); }
        .legal-doc a { color: rgb(196 181 253); text-decoration: none; }
        .legal-doc a:hover { color: white; text-decoration: underline; }
        .legal-doc strong { color: white; font-weight: 600; }
        .legal-doc code { background: rgba(255,255,255,0.05); padding: 1px 6px; border-radius: 4px; font-size: 0.875em; color: rgb(196 181 253); }
      `}</style>
    </div>
  );
}
