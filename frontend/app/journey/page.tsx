'use client';

/*
 * /journey — подробный story-walkthrough «от регистрации до первого клиента».
 * 7 этапов, линейный scroll, mock-интерфейсы в коде (SpaceX-style).
 * Покупатель скроллит и понимает что его ждёт: где регистрироваться,
 * какие настройки, как клиент в итоге попадает на услугу.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Mail,
  Bot,
  ListChecks,
  Globe,
  MessagesSquare,
  Calendar,
  BellRing,
  Check,
  Menu,
  X as XIcon,
} from 'lucide-react';
import { Logo } from '@/components/landing/Logo';
import { track } from '@/lib/analytics';
import { RevealInit } from '@/components/landing/RevealInit';
import { ScrollProgress } from '@/components/landing/ScrollProgress';
import { SectionParallax } from '@/components/landing/SectionParallax';

const STEPS = [
  {
    num: '01',
    eyebrow: 'Регистрация',
    title: '30 секунд — и вы внутри',
    text: 'Почта, пароль и ниша бизнеса. Никаких реквизитов, никакой карты. Сразу попадаете в дашборд.',
    duration: '~ 30 секунд',
    icon: Mail,
  },
  {
    num: '02',
    eyebrow: 'Подключение канала',
    title: 'Telegram за 3 клика',
    text: 'В @BotFather создаёте своего бота, копируете токен, вставляете в админку Liva. Всё — ИИ уже у вас в Telegram-канале и отвечает клиентам.',
    duration: '~ 3 минуты',
    icon: Bot,
  },
  {
    num: '03',
    eyebrow: 'Услуги и расписание',
    title: 'Загружаете прайс одним файлом',
    text: 'Услуги, мастера, рабочие часы, выходные. Заносится через простые формы или CSV. ИИ сразу знает, что вы продаёте и когда работаете.',
    duration: '~ 7 минут',
    icon: ListChecks,
  },
  {
    num: '04',
    eyebrow: 'Виджет на сайт',
    title: 'Чат-окно одной строкой',
    text: 'Вешаете <script src="api.ailiva.ru/widget.js"> на свой сайт — внизу справа появляется чат. Клиенты с сайта тоже попадают к ИИ.',
    duration: '~ 5 минут',
    icon: Globe,
  },
  {
    num: '05',
    eyebrow: 'Первый клиент',
    title: 'ИИ отвечает за 3 секунды',
    text: 'Кто-то пишет «можно записаться на пятницу?» — Liva ai проверяет ваше расписание, видит свободные окна, предлагает варианты. На любом языке формулировки.',
    duration: 'Реальное время',
    icon: MessagesSquare,
  },
  {
    num: '06',
    eyebrow: 'Запись',
    title: 'Падает прямо в YClients',
    text: 'Клиент выбрал время — ИИ создаёт запись в YClients (или в встроенный календарь, если YClients не подключён) и показывает её в админке Liva.',
    duration: 'Мгновенно',
    icon: Calendar,
  },
  {
    num: '07',
    eyebrow: 'Напоминания',
    title: 'За 24 и 2 часа до визита',
    text: 'ИИ автоматически шлёт напоминания в тот же канал, где клиент записался. После визита — статус «выполнено», цифры идут в аналитику.',
    duration: 'Автопилот',
    icon: BellRing,
  },
];

export default function JourneyPage() {
  return (
    <div className="relative min-h-screen bg-black text-white antialiased">
      <RevealInit />
      <ScrollProgress />
      <SectionParallax />
      <JourneyHeader />

      {/* ───────── HERO ───────── */}
      <section className="relative flex min-h-[70svh] items-center overflow-hidden">
        <div className="mx-auto w-full max-w-7xl px-6 pb-16 pt-32 sm:pb-20 sm:pt-40">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">
            Путь клиента
          </div>
          <h1 className="font-bebas mt-5 text-[3rem] uppercase leading-[1.02] tracking-[0.04em] sm:text-[5rem] lg:text-[6rem]">
            От регистрации
            <br />
            до <span className="text-[#60A5FA]">первого клиента</span>
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-[1.6] text-white/70">
            7 шагов. Один вечер. Никакого кода. Смотрите как именно работает Liva ai —
            от первой кнопки до записи, упавшей в ваш YClients.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/register"
              onClick={() => track('cta_register', { location: 'journey_hero' })}
              className="group inline-flex items-center gap-2 rounded-full bg-[#3B82F6] px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_0_1px_rgba(59,130,246,0.4),0_0_40px_-8px_rgba(59,130,246,0.7)] transition-all hover:bg-[#2563EB]"
            >
              Начать бесплатно
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#step-01"
              className="inline-flex items-center gap-2 rounded-full border border-white/70 px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white hover:text-black"
            >
              Смотреть шаги
            </a>
          </div>
        </div>
      </section>

      {/* ───────── STEPS ───────── */}
      {STEPS.map((s, i) => (
        <StepBand key={s.num} {...s} index={i} />
      ))}

      {/* ───────── FINAL CTA ───────── */}
      <section className="relative flex min-h-[60svh] items-center justify-center border-t border-white/[0.08] py-32">
        <div className="reveal mx-auto max-w-4xl px-6 text-center">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">
            Готовы начать?
          </div>
          <h2 className="parallax-slow font-bebas mx-auto mt-5 max-w-3xl text-[3rem] uppercase leading-[1.02] tracking-[0.04em] sm:text-[5rem]">
            Первый клиент —{' '}
            <span className="text-[#60A5FA]">сегодня вечером</span>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[15px] leading-[1.6] text-white/70">
            Регистрация бесплатно. Первая 1 000 сообщений в подарок. Отмена в один клик.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              onClick={() => track('cta_register', { location: 'journey_final' })}
              className="group inline-flex items-center gap-2 rounded-full bg-[#3B82F6] px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_0_1px_rgba(59,130,246,0.4),0_0_40px_-8px_rgba(59,130,246,0.7)] transition-all hover:bg-[#2563EB]"
            >
              Попробовать бесплатно
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-full border border-white/70 px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white hover:text-black"
            >
              Попробовать ИИ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ───────── STEP BAND ───────── */

function StepBand({
  num,
  eyebrow,
  title,
  text,
  duration,
  icon: Icon,
  index,
}: {
  num: string;
  eyebrow: string;
  title: string;
  text: string;
  duration: string;
  icon: React.ComponentType<{ className?: string }>;
  index: number;
}) {
  // Чередуем расположение mock'а: чётные шаги — справа, нечётные — слева
  const reverse = index % 2 === 1;
  return (
    <section
      id={`step-${num}`}
      className="relative border-t border-white/[0.08] py-24 sm:py-32"
    >
      <div className="reveal mx-auto max-w-7xl px-6">
        <div
          className={
            'grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20 ' +
            (reverse ? 'lg:[&>*:first-child]:order-2' : '')
          }
        >
          {/* Текст */}
          <div>
            <div className="flex items-baseline gap-4">
              <div className="font-bebas text-[5rem] leading-[0.85] tracking-[0.04em] text-[#60A5FA] sm:text-[7rem]">
                {num}
              </div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">
                {eyebrow}
              </div>
            </div>
            <h2 className="parallax-slow font-bebas mt-6 text-[2rem] uppercase leading-[1.05] tracking-[0.04em] sm:text-[3rem]">
              {title}
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-[1.65] text-white/70">{text}</p>
            <div className="mt-7 inline-flex items-center gap-2.5 border border-white/15 px-3.5 py-1.5">
              <Icon className="h-3.5 w-3.5 text-[#60A5FA]" />
              <span className="text-[11px] uppercase tracking-[0.14em] text-white/60">
                {duration}
              </span>
            </div>
          </div>

          {/* Mock-визуал */}
          <div>
            <StepMock num={num} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── MOCK VISUALS — отдельный switch по номеру шага ───────── */

function StepMock({ num }: { num: string }) {
  switch (num) {
    case '01':
      return <MockRegister />;
    case '02':
      return <MockTelegramSetup />;
    case '03':
      return <MockServices />;
    case '04':
      return <MockWidget />;
    case '05':
      return <MockChat />;
    case '06':
      return <MockBookingCreated />;
    case '07':
      return <MockReminder />;
    default:
      return null;
  }
}

function BrowserFrame({ children, url }: { children: React.ReactNode; url?: string }) {
  return (
    <div className="overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-[0_30px_80px_-30px_rgba(59,130,246,0.35)]">
      <div className="flex items-center gap-1.5 border-b border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        {url && (
          <div className="ml-3 inline-flex items-center gap-1.5 rounded-sm bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
            <Globe className="h-2.5 w-2.5" />
            {url}
          </div>
        )}
      </div>
      <div className="bg-black p-6">{children}</div>
    </div>
  );
}

/* 01 — регистрация */
function MockRegister() {
  return (
    <BrowserFrame url="ailiva.ru/register">
      <div className="font-bebas text-[1.5rem] uppercase tracking-[0.04em]">Регистрация</div>
      <p className="mt-1 text-[12px] text-white/55">Создаём аккаунт за 30 секунд</p>
      <div className="mt-5 space-y-3">
        <MockInput label="EMAIL" value="ivan@studio-grace.ru" />
        <MockInput label="ПАРОЛЬ" value="••••••••••" />
        <MockSelect label="НИША БИЗНЕСА" value="Салон красоты" />
      </div>
      <div className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-[#3B82F6] py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
        Создать аккаунт
        <ArrowRight className="h-3 w-3" />
      </div>
    </BrowserFrame>
  );
}

/* 02 — подключение Telegram */
function MockTelegramSetup() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* @BotFather chat */}
      <div className="overflow-hidden border border-white/10 bg-[#0a0a0a]">
        <div className="border-b border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-white/50">
          @BotFather
        </div>
        <div className="space-y-2 p-3 text-[11px] leading-snug">
          <div className="rounded-sm bg-white/[0.06] px-2.5 py-1.5 text-white/85">/newbot</div>
          <div className="rounded-sm bg-white/[0.06] px-2.5 py-1.5 text-white/85">
            Done! Your token:<br />
            <span className="text-[#60A5FA]">7234:AAEx...kQ8</span>
          </div>
        </div>
      </div>
      {/* Liva admin token field */}
      <div className="overflow-hidden border border-[#3B82F6]/40 bg-[#0a0a0a]">
        <div className="border-b border-[#3B82F6]/30 bg-[#3B82F6]/[0.06] px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-[#60A5FA]">
          Админка Liva
        </div>
        <div className="p-3">
          <div className="text-[9px] uppercase tracking-[0.14em] text-white/45">TG TOKEN</div>
          <div className="mt-1.5 truncate border border-white/15 bg-white/[0.04] px-2 py-1.5 text-[11px] text-white">
            7234:AAEx...kQ8
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-500/15 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-emerald-300">
            <Check className="h-2.5 w-2.5" />
            Подключено
          </div>
        </div>
      </div>
    </div>
  );
}

/* 03 — услуги/расписание */
function MockServices() {
  return (
    <BrowserFrame url="ailiva.ru/dashboard/services">
      <div className="font-bebas text-[1.5rem] uppercase tracking-[0.04em]">Услуги</div>
      <div className="mt-4 divide-y divide-white/[0.08] border-y border-white/[0.08]">
        {[
          { name: 'Женская стрижка', price: '2 500 ₽', dur: '60 мин' },
          { name: 'Мужская стрижка', price: '1 500 ₽', dur: '40 мин' },
          { name: 'Окрашивание (длина 1)', price: '5 500 ₽', dur: '120 мин' },
          { name: 'Маникюр с покрытием', price: '2 200 ₽', dur: '90 мин' },
          { name: 'Педикюр с покрытием', price: '2 800 ₽', dur: '90 мин' },
        ].map((s) => (
          <div key={s.name} className="flex items-center justify-between gap-4 py-2.5">
            <div className="text-[13px] text-white/85">{s.name}</div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-white/45">{s.dur}</span>
              <span className="text-[#60A5FA] font-semibold tabular-nums">{s.price}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 inline-flex items-center gap-2 border border-white/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-white/60">
        + Добавить услугу
      </div>
    </BrowserFrame>
  );
}

/* 04 — виджет на сайт */
function MockWidget() {
  return (
    <BrowserFrame url="ваш-сайт.ру">
      {/* Имитация сайта-клиента с виджетом */}
      <div className="relative h-[260px] overflow-hidden border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent">
        <div className="space-y-2 p-5">
          <div className="h-3 w-2/3 bg-white/15" />
          <div className="h-2 w-1/2 bg-white/10" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="aspect-square bg-white/10" />
            <div className="aspect-square bg-white/10" />
            <div className="aspect-square bg-white/10" />
          </div>
        </div>
        {/* Виджет в углу */}
        <div className="absolute bottom-3 right-3 max-w-[170px] border border-[#3B82F6]/40 bg-[#0a0a0a] p-2.5 shadow-[0_8px_24px_-8px_rgba(59,130,246,0.6)]">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[9px] uppercase tracking-[0.14em] text-emerald-300">
              онлайн
            </span>
          </div>
          <div className="mt-1 text-[10px] font-semibold text-white">Чем помочь?</div>
          <div className="mt-1.5 text-[9px] text-white/55">
            Сколько стоит маникюр?
          </div>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto bg-black/40 px-3 py-2 font-mono text-[10px] text-white/60">
        &lt;script src="api.ailiva.ru/widget.js?salon=YOUR_ID"&gt;&lt;/script&gt;
      </div>
    </BrowserFrame>
  );
}

/* 05 — первый клиент */
function MockChat() {
  return (
    <div className="overflow-hidden border border-white/10 bg-[#0a0a0a]">
      <div className="flex items-center gap-2 border-b border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#3B82F6]/30 to-[#2563EB]/30 text-[10px] font-semibold text-white">
          ИИ
        </span>
        <div>
          <div className="text-[12px] font-semibold text-white">Liva ai</div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-300">
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            Telegram · онлайн
          </div>
        </div>
      </div>
      <div className="space-y-2.5 p-4">
        <ChatBubble role="user">
          Здравствуйте! Хочу записаться на маникюр в пятницу
        </ChatBubble>
        <ChatBubble role="ai">
          Подберём! В пятницу свободно:<br />
          12:00 · 15:30 · 18:00 — у мастера Игоря.
          <br />
          Какое время удобно?
        </ChatBubble>
        <ChatBubble role="user">15:30</ChatBubble>
        <ChatBubble role="ai">
          Записала — пятница, 15:30, маникюр с покрытием, мастер Игорь. Напомню за 2 часа 🙌
        </ChatBubble>
      </div>
    </div>
  );
}

function ChatBubble({ role, children }: { role: 'user' | 'ai'; children: React.ReactNode }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={
          isUser
            ? 'max-w-[80%] rounded-sm rounded-br-none bg-white/15 px-3 py-1.5 text-[11px] text-white/95'
            : 'max-w-[85%] rounded-sm rounded-bl-none border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/90'
        }
      >
        {children}
      </div>
    </div>
  );
}

/* 06 — запись создана */
function MockBookingCreated() {
  return (
    <BrowserFrame url="ailiva.ru/dashboard">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bebas text-[1.5rem] uppercase tracking-[0.04em]">Главная</div>
          <div className="mt-0.5 text-[10px] text-white/45">Только что · новая запись</div>
        </div>
        <div className="inline-flex items-center gap-1.5 border border-emerald-400/30 bg-emerald-400/[0.08] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald-300">
          <Check className="h-3 w-3" />
          YClients: sync ok
        </div>
      </div>
      <div className="mt-5 border border-[#3B82F6]/30 bg-[#3B82F6]/[0.05] p-4">
        <div className="text-[10px] uppercase tracking-[0.14em] text-[#60A5FA]">
          Новая запись
        </div>
        <div className="font-bebas mt-1.5 text-[1.4rem] uppercase tracking-[0.02em]">
          Анна К. · Маникюр
        </div>
        <div className="mt-1 text-[12px] text-white/70">
          Пятница, 18 апреля · 15:30 · мастер Игорь
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] text-white/50">
          <MessagesSquare className="h-3 w-3" />
          из Telegram, 2 мин назад
        </div>
      </div>
      {/* mini metrics row */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <MiniMetric label="Записи" value="+1" />
        <MiniMetric label="Сообщений" value="4" />
        <MiniMetric label="Конверсия" value="100%" />
      </div>
    </BrowserFrame>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/[0.08] py-2">
      <div className="text-[9px] uppercase tracking-[0.14em] text-white/45">{label}</div>
      <div className="font-bebas mt-0.5 text-[1.1rem] tracking-[0.04em] text-[#60A5FA]">
        {value}
      </div>
    </div>
  );
}

/* 07 — напоминание */
function MockReminder() {
  return (
    <div className="space-y-3">
      <div className="border border-white/10 bg-[#0a0a0a] p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-white/45">
          <BellRing className="h-3 w-3" />
          Telegram · вчера 15:30
        </div>
        <div className="mt-2 text-[12px] text-white/90">
          Анна, напоминаю: завтра в 15:30 — маникюр у Игоря. Если что-то изменится, напишите 🙏
        </div>
      </div>
      <div className="border border-white/10 bg-[#0a0a0a] p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-white/45">
          <BellRing className="h-3 w-3" />
          Telegram · сегодня 13:30
        </div>
        <div className="mt-2 text-[12px] text-white/90">
          Анна, через 2 часа жду вас — Студия Грация, ул. Ленина 12. До встречи! 💅
        </div>
      </div>
      <div className="border border-emerald-400/30 bg-emerald-400/[0.05] p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-emerald-300">
          <Check className="h-3 w-3" />
          Сегодня 16:35
        </div>
        <div className="font-bebas mt-2 text-[1.1rem] uppercase tracking-[0.04em]">
          Анна пришла. Запись закрыта.
        </div>
        <div className="mt-1 text-[11px] text-white/55">
          Цикл закончен — данные ушли в аналитику.
        </div>
      </div>
    </div>
  );
}

/* ───────── PRIMITIVES ───────── */

function MockInput({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.14em] text-white/45">{label}</div>
      <div className="mt-1.5 border border-white/15 bg-white/[0.04] px-3 py-2 text-[12px] text-white/85">
        {value}
      </div>
    </div>
  );
}

function MockSelect({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.14em] text-white/45">{label}</div>
      <div className="mt-1.5 flex items-center justify-between border border-white/15 bg-white/[0.04] px-3 py-2 text-[12px] text-white/85">
        {value}
        <span className="text-white/40">▾</span>
      </div>
    </div>
  );
}

/* ───────── HEADER ───────── */

function JourneyHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={
          'fixed inset-x-0 top-0 z-50 transition-colors duration-300 ' +
          (scrolled ? 'bg-black/75 backdrop-blur-md' : 'bg-transparent')
        }
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center">
            <Logo size={26} variant="light" />
          </Link>
          <nav className="hidden items-center gap-8 text-[12px] font-bold uppercase tracking-[0.14em] text-white md:flex">
            <Link href="/#demo" className="hover:text-white/70">Демо</Link>
            <Link href="/#features" className="hover:text-white/70">Возможности</Link>
            <Link href="/journey" className="hover:text-white/70">Как работает</Link>
            <Link href="/#pricing" className="hover:text-white/70">Тарифы</Link>
            <Link href="/login" className="hover:text-white/70">Войти</Link>
            <Link
              href="/register"
              className="rounded-full border border-white/70 px-5 py-2 text-[11px] hover:bg-white hover:text-black"
            >
              Начать
            </Link>
          </nav>
          <button onClick={() => setOpen(true)} aria-label="Меню" className="md:hidden">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black md:hidden">
          <div className="flex items-center justify-between px-6 py-5">
            <Logo size={26} variant="light" />
            <button onClick={() => setOpen(false)} aria-label="Закрыть">
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col items-center justify-center gap-7 text-[18px] font-bold uppercase tracking-[0.14em]">
            <Link href="/#demo" onClick={() => setOpen(false)}>Демо</Link>
            <Link href="/#features" onClick={() => setOpen(false)}>Возможности</Link>
            <Link href="/journey" onClick={() => setOpen(false)}>Как работает</Link>
            <Link href="/#pricing" onClick={() => setOpen(false)}>Тарифы</Link>
            <Link href="/login" onClick={() => setOpen(false)}>Войти</Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="mt-4 rounded-full border border-white/70 px-7 py-3"
            >
              Начать
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
