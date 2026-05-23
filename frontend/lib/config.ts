'use client';

import { useAuthStore } from './auth';

/**
 * Хук возвращает SALON_ID текущего залогиненного пользователя.
 * Использовать только внутри `/dashboard/*` (там layout гарантирует, что user уже загружен).
 *
 * До подключения этого хука был хардкод 'cmpfhd7ha00001s7ud34xwfmw'.
 */
export function useSalonId(): string {
  const id = useAuthStore((s) => s.salon?.id || s.user?.salonId);
  if (!id) {
    // Защита от рендера до загрузки auth — layout не должен такого допускать,
    // но fallback на тестовый салон чтоб ничего не упало в dev.
    return 'cmpfhd7ha00001s7ud34xwfmw';
  }
  return id;
}
