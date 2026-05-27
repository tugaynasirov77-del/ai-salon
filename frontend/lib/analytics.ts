// Лёгкая клиентская аналитика на Supabase REST API.
// Не использует @supabase/supabase-js — просто fetch() против /rest/v1/events.
// Без NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY превращается
// в no-op (полезно для preview-окружений и локалки без ключей).
//
// Схема таблицы events (создать в Supabase один раз):
//
//   create table public.events (
//     id          uuid primary key default gen_random_uuid(),
//     ts          timestamptz not null default now(),
//     event_name  text not null,
//     page        text,
//     session_id  text,
//     meta        jsonb,
//     user_agent  text,
//     referrer    text
//   );
//
//   alter table public.events enable row level security;
//   create policy "anon can insert events"
//     on public.events for insert
//     to anon
//     with check (true);
//   -- SELECT не разрешаем для anon — данные смотрим через Supabase Studio
//     или через service_role в админке.

const URL_ENV = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY_ENV = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ENABLED = !!URL_ENV && !!KEY_ENV;

const SESSION_KEY = 'liva_analytics_session_v1';
const FALLBACK_UUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : FALLBACK_UUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

export interface TrackPayload {
  event_name: string;
  page?: string;
  session_id?: string;
  meta?: Record<string, unknown>;
  user_agent?: string;
  referrer?: string;
}

/**
 * Fire-and-forget insert. Никогда не блокирует UI, никогда не бросает.
 * Сетевые ошибки молча игнорируются.
 */
export function track(eventName: string, meta?: Record<string, unknown>): void {
  if (!ENABLED) return;
  if (typeof window === 'undefined') return;

  const payload: TrackPayload = {
    event_name: eventName,
    page: window.location.pathname + window.location.search,
    session_id: getSessionId(),
    meta: meta && Object.keys(meta).length > 0 ? meta : undefined,
    user_agent: window.navigator.userAgent.slice(0, 500),
    referrer: document.referrer ? document.referrer.slice(0, 500) : undefined,
  };

  // keepalive=true позволяет запросу долететь даже при навигации
  // (например, клик по <a href="/register"> сразу уносит страницу)
  try {
    fetch(`${URL_ENV}/rest/v1/events`, {
      method: 'POST',
      headers: {
        apikey: KEY_ENV!,
        Authorization: `Bearer ${KEY_ENV}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* no-op */
  }
}

/** Удобный helper для page-view (вызывается из AnalyticsProvider на каждом route change) */
export function trackPageView(path?: string) {
  track('page_view', path ? { path } : undefined);
}

/** Включена ли аналитика (env-vars выставлены). Полезно для условного рендеринга. */
export const analyticsEnabled = ENABLED;
