'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { NotificationManager } from '@/components/dashboard/NotificationManager';
import { apiMe, apiLogout, hasToken, useAuthStore } from '@/lib/auth';
import { Logo } from '@/components/landing/Logo';
import { fetchConversations } from '@/lib/api';

const NAV = [
  { href: '/dashboard', label: 'Главная', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/conversations', label: 'Диалоги', icon: MessageSquare },
  { href: '/dashboard/clients', label: 'Клиенты', icon: Users },
  { href: '/dashboard/schedule', label: 'Расписание', icon: Calendar },
  { href: '/dashboard/analytics', label: 'Аналитика', icon: BarChart3 },
  { href: '/dashboard/services', label: 'Услуги', icon: Scissors },
  { href: '/dashboard/masters', label: 'Мастера', icon: UserCog },
  { href: '/dashboard/working-hours', label: 'График', icon: CalendarClock },
  { href: '/dashboard/faq', label: 'FAQ', icon: HelpCircle },
  { href: '/dashboard/test-chat', label: 'Тест-чат', icon: Sparkles },
  { href: '/dashboard/settings', label: 'Настройки', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, salon, loaded, setSession, clear } = useAuthStore();

  const convQ = useQuery({
    queryKey: ['conversations', salon?.id],
    queryFn: () => fetchConversations(salon!.id),
    enabled: !!salon?.id && loaded,
    refetchInterval: 15_000,
  });
  const totalUnread = (convQ.data || []).reduce((s, c) => s + (c.unreadCount || 0), 0);

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
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-black px-4 py-3 md:hidden">
        <Logo size={26} variant="light" />
        <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Меню" className="text-white">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 border-r border-white/[0.08] bg-black transition-transform',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/[0.08] px-5 py-5">
            <Logo size={28} variant="light" />
            <div className="mt-4 font-bebas text-[15px] uppercase tracking-[0.08em] text-white">
              {salon?.name || '—'}
            </div>
            <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
              Тариф · {salon?.plan || 'free'}
            </div>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors',
                    active
                      ? 'bg-white/[0.06] text-white'
                      : 'text-white/55 hover:bg-white/[0.03] hover:text-white',
                  )}
                >
                  {active && <span className="absolute left-0 top-0 h-full w-0.5 bg-[#3B82F6]" />}
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.href === '/dashboard/conversations' && totalUnread > 0 && (
                    <span className="rounded-full bg-[#3B82F6] px-1.5 py-0.5 text-[10px] font-semibold tracking-normal text-white">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/[0.08] px-5 py-3">
            <ChannelStatus />
          </div>

          <div className="flex items-center gap-3 border-t border-white/[0.08] px-5 py-3">
            <Link
              href="/dashboard/profile"
              onClick={() => setMobileOpen(false)}
              className="flex flex-1 items-center gap-3 p-1 transition-colors hover:bg-white/[0.04]"
              aria-label="Профиль"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-sm font-semibold text-white">
                {(salon?.ownerName || user.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 truncate text-[11px] font-medium uppercase tracking-[0.14em] text-white/70">
                {salon?.ownerName || user.email}
              </div>
            </Link>
            <button onClick={logout} className="text-white/45 transition-colors hover:text-red-400" aria-label="Выход">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="md:ml-60">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">{children}</div>
      </main>

      <NotificationManager unreadTotal={totalUnread} />
    </div>
  );
}
