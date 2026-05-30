'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Будет видно в Vercel logs / браузерной консоли. Sentry/трекер добавим позже.
    console.error('[dashboard error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
          <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-[#181B22] dark:text-slate-100">Что-то пошло не так</h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Эта страница упала. Можно попробовать перезагрузить или вернуться на главную.
        </p>
        {error?.message && (
          <pre className="mb-4 max-h-32 overflow-auto rounded-md bg-slate-100 px-3 py-2 text-left text-xs text-slate-700 dark:bg-[#181B22] dark:text-slate-300">
            {error.message}
          </pre>
        )}
        {error?.digest && (
          <div className="mb-4 text-[11px] text-slate-400">ID ошибки: {error.digest}</div>
        )}
        <div className="flex justify-center gap-2">
          <Button onClick={() => reset()}>
            <RefreshCcw className="h-4 w-4" />
            Попробовать снова
          </Button>
          <Button variant="outline" onClick={() => { window.location.href = '/dashboard'; }}>
            <Home className="h-4 w-4" />
            На главную
          </Button>
        </div>
      </Card>
    </div>
  );
}
