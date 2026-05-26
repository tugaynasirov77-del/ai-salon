'use client';

import { useAuthStore } from './auth';

/**
 * Хук возвращает SALON_ID текущего залогиненного пользователя.
 * Использовать только внутри `/dashboard/*` — там `app/dashboard/layout.tsx`
 * показывает спиннер, пока `apiMe()` не загрузил user/salon, поэтому к моменту
 * рендера дочерней страницы id гарантированно есть.
 *
 * Если хук всё-таки сработает без user (баг в layout) — бросаем ошибку,
 * чтобы упасть громко вместо тихого обращения к чужому салону.
 */
export function useSalonId(): string {
  const id = useAuthStore((s) => s.salon?.id || s.user?.salonId);
  if (!id) {
    throw new Error('useSalonId() вызван до загрузки auth. Этот хук разрешён только внутри /dashboard/*');
  }
  return id;
}
