# Аналитика на Supabase — настройка

Лёгкая клиентская аналитика для лендинга и /demo. Без `@supabase/supabase-js` —
напрямую через `fetch()` на REST API. Без ENV-переменных превращается в no-op,
поэтому preview/локалка не шумят.

## 1. Создать таблицу в Supabase

В SQL editor выполнить один раз:

```sql
create table public.events (
  id          uuid primary key default gen_random_uuid(),
  ts          timestamptz not null default now(),
  event_name  text not null,
  page        text,
  session_id  text,
  meta        jsonb,
  user_agent  text,
  referrer    text
);

create index events_ts_idx on public.events (ts desc);
create index events_event_name_idx on public.events (event_name);

alter table public.events enable row level security;

create policy "anon can insert events"
  on public.events for insert
  to anon
  with check (true);
-- SELECT для anon НЕ даём — данные смотрим в Supabase Studio
-- или через service_role в админке.
```

## 2. Добавить ENV-переменные в Vercel

В `Project Settings → Environment Variables`:

| Имя | Значение | Окружение |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon-ключ из Project Settings → API | Production + Preview |

После добавления — `Redeploy` чтобы новая сборка подхватила переменные.

## 3. Что отслеживается

### Page-views
Автоматически на каждое изменение URL в SPA (через `AnalyticsProvider` в корневом
layout). Событие `page_view`, `meta.path` — путь.

### Вовлечённость на лендинге (`ScrollTracker`)

| Событие | Когда | `meta` |
|---|---|---|
| `scroll_depth` | Посетитель доскроллил до 25 / 50 / 75 / 100% | `percent` |
| `section_view` | Секция показалась на экране ≥40% | `section` (`demo`,`features`,`how`,`pricing`,`faq`) |

Каждое — не более одного раза за загрузку страницы.

### CTA-клики (`cta_register` / `cta_turnkey_anchor` / `cta_demo`)

| Событие | Где | `meta.location` |
|---|---|---|
| `cta_register` | Header «Попробовать бесплатно» | `header` |
| `cta_register` | Hero «Попробовать бесплатно» | `hero` |
| `cta_register` | Pricing Self-Start | `pricing_self_start` |
| `cta_register` | Финальный CTA-блок | `final_cta` |
| `cta_register` | Sticky-бар «Начать бесплатно» | `sticky` |
| `cta_register` | /demo header | `demo_header` |
| `cta_register` | /demo нижний CTA | `demo_footer` |
| `cta_turnkey_anchor` | Hero «Подключим за вас за 1 день» | `hero` |
| `cta_turnkey_anchor` | Финальный CTA «Подключим за вас» | `final_cta` |
| `cta_turnkey_anchor` | /demo нижний «Подключим за вас» | `demo_footer` |
| `cta_turnkey_open` | Pricing «Под ключ» (открывает модалку) | `pricing_turnkey` |
| `cta_pricing_anchor` | Sticky «Тарифы» | `sticky` |
| `cta_demo` | Большая карточка «Открыть полное демо» | `demo_card` |
| `cta_demo` | Плавающая кнопка в углу | `floating` |

### Конверсии (главные!)

| Событие | Когда | `meta` |
|---|---|---|
| `lead_submitted` | Успешная отправка формы «Под ключ» | `niche`, `city`, `has_comment`, `source` |
| `register_completed` | Успешная регистрация на /register | `niche`, `has_phone`, `has_address` |
| `demo_first_message` | Посетитель отправил первое сообщение в /demo | `has_image`, `has_voice`, `text_length` |

## 4. Готовые запросы для дашборда

В Supabase SQL editor / любом BI:

```sql
-- Воронка за последние 7 дней
select event_name, count(*) as n
from public.events
where ts > now() - interval '7 days'
  and event_name in (
    'page_view','cta_register','cta_demo','demo_first_message',
    'cta_turnkey_open','lead_submitted','register_completed'
  )
group by event_name
order by n desc;

-- CTR разных кнопок «Попробовать бесплатно»
select meta->>'location' as location, count(*) as clicks
from public.events
where event_name = 'cta_register'
  and ts > now() - interval '7 days'
group by location
order by clicks desc;

-- Уникальные сессии за день
select date_trunc('day', ts) as day,
       count(distinct session_id) as unique_sessions
from public.events
where ts > now() - interval '14 days'
group by day
order by day desc;

-- Конверсия в лида по нишам
select meta->>'niche' as niche, count(*) as leads
from public.events
where event_name = 'lead_submitted'
group by niche
order by leads desc;
```

## 5. Как добавить новое событие

В нужном компоненте:

```tsx
import { track } from '@/lib/analytics';

<button onClick={() => track('my_event', { foo: 'bar' })}>...</button>
```

Без подключения ENV ничего не отправляется — track становится no-op.

## Privacy / 152-ФЗ

- Не пишем IP в payload явно (Supabase его всё равно увидит — это нормально).
- Не пишем PII (имя/телефон/email). В `lead_submitted` сохраняем только
  ниша/город/факт комментария — без содержимого.
- `user_agent` обрезаем до 500 символов.
- Хранение в Supabase — нужно проверить регион проекта; если важна РФ —
  использовать европейский регион или поднять собственный Supabase в РФ.
