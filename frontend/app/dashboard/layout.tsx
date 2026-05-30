'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  MessageSquare,
  Scissors,
  UserCog,
  CalendarClock,
  HelpCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChannelStatus } from '@/components/dashboard/ChannelStatus';
import { apiMe, apiLogout, hasToken, useAuthStore } from '@/lib/auth';
import { Logo } from '@/components/landing/Logo';

const NAV = [
  { href: '/dashboard', label: 'Главная', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/conversations', label: 'Диалоги', icon: MessageSquare },
  { href: '/dashboard/clients', label: 'Клиенты', icon: Users },
  { href: '/dashboard/schedule', label: 'Расписание', icon: Calendar },
  { href: '/dashboard/analytics', label: 'Аналитика', icon: BarChart3 },
  { href: '/dashboard/services', label: 'Услуги', icon: Scissors },
  { href: '/dashboard/masters', label: 'Мастера', icon: UserCog },
  { href: '/dashboard/working-hours', label: 'График работы', icon: CalendarClock },
  { href: '/dashboard/faq', label: 'FAQ', icon: HelpCircle },
  { href: '/dashboard/test-chat', label: 'Тест-чат', icon: Sparkles },
  { href: '/dashboard/settings', label: 'Настройки', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, salon, loaded, setSession, clear } = useAuthStore();

  // Auth guard + загрузка профиля при первом рендере
  useEffect(() => {
    if (loaded) return;
    if (!hasToken()) {
      router.replace('/login');
      return;
    }
    apiMe()
      .then((res) => setSession(res))
      .catch(() => {
        clear();
        router.replace('/login');
      });
  }, [loaded, router, setSession, clear]);

  function logout() {
    apiLogout();
    clear();
    router.replace('/login');
  }

  if (!loaded || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#080C14]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 text-[#12151C] dark:bg-[#080C14] dark:text-slate-100">
      {/* Ambient glow для премиальной атмосферы (только в dark) */}
      <div className="pointer-events-none fixed inset-0 -z-10 hidden dark:block">
        <div className="absolute -top-40 -left-32 h-[500px] w-[500px] rounded-full bg-amber-600/15 blur-[140px]" />
        <div className="absolute bottom-[-200px] right-[-100px] h-[480px] w-[480px] rounded-full bg-amber-600/10 blur-[140px]" />
      </div>

      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden dark:border-white/[0.06] dark:bg-[#080C14]/80 dark:backdrop-blur-xl">
        <Logo size={26} variant="auto" />
        <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Меню">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 border-r border-slate-200 bg-white transition-transform',
          'dark:border-white/[0.06] dark:bg-[#080C14]/80 dark:backdrop-blur-xl',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-100 px-5 py-5 dark:border-white/[0.06]">
            <Logo size={28} variant="auto" />
            <div className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
              {salon?.name || '—'}
            </div>
            <div className="text-xs text-slate-500">Тариф: {salon?.plan || 'free'}</div>
          </div>

          <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    active
                      ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-amber-500/10 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.25)] dark:text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-slate-200',
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#38BDF8] via-[#38BDF8] to-[#3B82F6]" />
                  )}
                  <Icon className={cn('h-4 w-4', active && 'text-amber-300')} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 px-5 py-3 dark:border-white/[0.06]">
            <ChannelStatus />
          </div>

          <div className="flex items-center gap-3 border-t border-slate-100 px-5 py-3 dark:border-white/[0.06]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3B82F6] via-[#3B82F6] to-[#2563EB] text-sm font-semibold text-white">
              {(salon?.ownerName || user.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-300">
              {salon?.ownerName || user.email}
            </div>
            <button onClick={logout} className="text-slate-400 transition-colors hover:text-red-400" aria-label="Выход">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="md:ml-60">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">{children}</div>
      </main>
    </div>
  );
}
