'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChannelStatus } from '@/components/dashboard/ChannelStatus';

const NAV = [
  { href: '/', label: 'Главная', icon: LayoutDashboard },
  { href: '/clients', label: 'Клиенты', icon: Users },
  { href: '/schedule', label: 'Расписание', icon: Calendar },
  { href: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { href: '/settings', label: 'Настройки', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="font-bold text-slate-900 dark:text-slate-100">Liva ai</div>
        <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Меню">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">Liva ai</div>
            <div className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Демо Салон
            </div>
            <div className="text-xs text-slate-500">Тариф: Free</div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
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
              И
            </div>
            <div className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
              Иван
            </div>
            <button className="text-slate-400 hover:text-slate-600" aria-label="Выход">
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
