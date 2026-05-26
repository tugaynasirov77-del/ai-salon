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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-900">
        <Logo size={26} variant="auto" />
        <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Меню">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
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
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <ChannelStatus />
          </div>

          <div className="flex items-center gap-3 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {(salon?.ownerName || user.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-300">
              {salon?.ownerName || user.email}
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-red-500" aria-label="Выход">
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
