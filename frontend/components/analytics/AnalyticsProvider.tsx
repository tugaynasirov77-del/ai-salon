'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

/**
 * Триггерит page_view при каждом изменении pathname/searchParams.
 * В App Router нет встроенного router.events — поэтому вешаем effect.
 * Монтируется в корневом layout, дальше ничего не делает.
 */
export function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const path = pathname + (searchParams?.toString() ? '?' + searchParams.toString() : '');
    trackPageView(path);
  }, [pathname, searchParams]);

  return null;
}
