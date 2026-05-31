'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

// Переключатель light/dark. Источник правды — класс .dark на <html> (его
// ставит анти-флэш скрипт из app/layout.tsx). При клике сохраняем выбор
// в localStorage('liva_theme'), чтобы следующая сессия открылась как надо.
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem('liva_theme', next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  }

  // До hydration рендерим пустую кнопку нужного размера, чтобы layout не прыгал
  if (theme === null) {
    return <span className={`inline-block h-8 w-8 ${className}`} aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200 ${className}`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
