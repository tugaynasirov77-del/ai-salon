'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X, Check } from 'lucide-react';
import { PricingSection } from '@/components/landing/PricingSection';
import { Logo } from '@/components/landing/Logo';
import { track } from '@/lib/analytics';
import { ComparisonTable } from '@/components/landing/ComparisonTable';
import { StickyCta } from '@/components/landing/StickyCta';
import { ScrollTracker } from '@/components/analytics/ScrollTracker';
import { TypingDemo } from '@/components/landing/TypingDemo';

/*
 * SpaceX-inspired redesign.
 * Источник design-токенов: VoltAgent/awesome-design-md → design-md/spacex/DESIGN.md.
 * - Чёрный canvas (#000), без aurora/glow
 * - Bebas Neue UPPERCASE как D-DIN-Bold
 * - Ghost-pill кнопки с +1.17px tracking
 * - Бренд-синий остаётся ТОЛЬКО на primary CTA («Попробовать бесплатно»)
 * - Каждая секция = band с full-bleed визуалом или плотным брутальным копирайтом
 */
export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-black text-white antialiased">
      <ScrollTracker />
      <SpaceXHeader />

      {/* ───────── HERO BAND ───────── */}
      <section className="relative flex min-h-[85svh] items-center overflow-hidden">
        {/* Full-bleed визуал — чат справа на lg+, fade в чёрный к центру */}
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute inset-y-0 right-0 hidden w-[52%] items-center justify-center lg:flex">
            <div className="w-full max-w-[560px] px-8 opacity-95">
              <TypingDemo />
            </div>
          </div>
          {/* Градиент: чёрный с лево-центра к чату, чтобы текст читался */}
          <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-black via-black to-transparent lg:via-black/85 lg:to-black/0 lg:right-[52%]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 pt-24 sm:pb-20 sm:pt-28">
          <Eyebrow>ИИ-администратор · сейчас отвечает клиентам</Eyebrow>
          <h1 className="font-bebas mt-5 text-[2.75rem] uppercase leading-[1.02] tracking-[0.04em] sm:text-[4.5rem] lg:text-[3.75rem] xl:text-[5rem]">
            Ваш
            <br />
            ИИ-администратор,
            <br />
            <span className="text-[#60A5FA]">который не спит</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-[1.6] text-white/70">
            Отвечает в Telegram, на Авито и на сайте — записывает клиента на услугу за минуту.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <CtaPrimary href="/register" onClick={() => track('cta_register', { location: 'hero' })}>
              Попробовать бесплатно
            </CtaPrimary>
            <CtaGhost href="/demo" onClick={() => track('cta_demo', { location: 'hero' })}>
              Смотреть демо
            </CtaGhost>
          </div>
        </div>
      </section>

      {/* ───────── TRUST BAND ───────── */}
      <section className="relative border-t border-white/[0.08] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <Eyebrow>Спокойно показывать клиентам</Eyebrow>
          <h2 className="font-bebas mt-4 max-w-3xl text-[2.5rem] uppercase leading-[1] tracking-[0.04em] sm:text-[3.5rem]">
            Три причины, почему Liva ai не страшно подключить
          </h2>

          <div className="mt-16 grid grid-cols-1 gap-px bg-white/[0.08] md:grid-cols-3">
            <TrustCell
              eyebrow="Под капотом"
              title="Claude Haiku от Anthropic"
              text="Одна из сильнейших AI-моделей мира — та же семья, что у Cursor и Notion AI. Отвечает как живой администратор: понимает контекст и неформальные формулировки."
            />
            <TrustCell
              eyebrow="Данные клиентов"
              title="Хранятся в России, 152-ФЗ"
              text="Серверы внутри РФ, шифрование при передаче, разграничение доступа. Соответствует требованиям к обработке персональных данных малого бизнеса."
            />
            <TrustCell
              eyebrow="Уже интегрировано"
              title="YClients, Telegram, Авито"
              text="Подключается к тому, что у вас уже работает. Запись попадает прямо в YClients, ответы идут из вашего Telegram-канала или Авито-аккаунта."
            />
          </div>
        </div>
      </section>

      {/* ───────── PAIN BAND ───────── */}
      <section className="relative border-t border-white/[0.08] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <Eyebrow>Знакомо</Eyebrow>
          <h2 className="font-bebas mt-4 max-w-4xl text-[2.5rem] uppercase leading-[1] tracking-[0.04em] sm:text-[4rem]">
            Каждое неотвеченное сообщение — клиент,
            <br />
            который ушёл к конкуренту.
          </h2>

          <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10">
            <PainBlock
              pain="Клиент написал в 22:30 — ответили утром. Он ушёл к конкуренту."
              gain="ИИ отвечает за 3 секунды в любое время суток."
            />
            <PainBlock
              pain="Администратор за 45 000 ₽ болеет, в отпуске, увольняется."
              gain="Liva ai работает 365 дней в году. 2 500 ₽/мес."
            />
            <PainBlock
              pain="Диалоги в трёх мессенджерах — половину забываете."
              gain="Telegram, Авито, веб-чат и записи в одной админке."
            />
          </div>
        </div>
      </section>

      {/* ───────── DEMO BAND ───────── */}
      <section
        id="demo"
        className="relative border-t border-white/[0.08] py-24 sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-6">
          <Eyebrow>Демо</Eyebrow>
          <h2 className="font-bebas mt-4 max-w-3xl text-[2.5rem] uppercase leading-[1] tracking-[0.04em] sm:text-[4rem]">
            Так выглядит диалог с клиентом
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-[1.6] text-white/70">
            Слева — живой пример работы ИИ. В полном демо вы сами пишете как клиент,
            а справа в реальном времени видите, что появляется у владельца в админке.
          </p>

          <div className="mt-12 grid grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div>
              <TypingDemo />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 border border-emerald-400/40 bg-emerald-400/[0.06] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Запись создана автоматически
              </div>
              <ul className="mt-8 space-y-4 text-[15px] text-white/80">
                <Bullet>Понимает свободные формулировки и опечатки</Bullet>
                <Bullet>Сразу проверяет свободные слоты в YClients</Bullet>
                <Bullet>Подтверждает запись и шлёт напоминания за 24 и 2 часа</Bullet>
              </ul>
              <div className="mt-10">
                <CtaGhost href="/demo" onClick={() => track('cta_demo', { location: 'demo_card' })}>
                  Открыть полное демо
                </CtaGhost>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FEATURES BAND ───────── */}
      <section id="features" className="relative border-t border-white/[0.08] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <Eyebrow>Возможности</Eyebrow>
          <h2 className="font-bebas mt-4 max-w-3xl text-[2.5rem] uppercase leading-[1] tracking-[0.04em] sm:text-[4rem]">
            Всё, что делает живой администратор
          </h2>

          <div className="mt-16 grid grid-cols-1 gap-px bg-white/[0.08] md:grid-cols-2 lg:grid-cols-3">
            <FeatureCell title="AI на Claude — не сценарий" text="Отвечает на нестандартные вопросы, понимает опечатки и контекст. Не «зависает» на фразе вне сценария." />
            <FeatureCell title="Запись в YClients" text="Свободные слоты, мастера, услуги — синхронно с вашим расписанием. Запись падает прямо в YClients." />
            <FeatureCell title="Напоминания 24 и 2 часа" text="Автоматические напоминания клиенту за сутки и за 2 часа до визита. Меньше пустых слотов и забывших про запись." />
            <FeatureCell title="Эскалация владельцу" text="Если AI не уверен в ответе — сразу пишет вам в Telegram. Вы всегда в курсе и можете ответить лично." />
            <FeatureCell title="9 ниш из коробки" text="Салоны, барбершопы, фитнес, клиники, СТО, рестораны, юристы, репетиторы и другое." />
            <FeatureCell title="Аналитика в реальном времени" text="Сколько диалогов и записей, конверсия, топ-услуги и какие вопросы клиенты задают чаще всего." />
          </div>
        </div>
      </section>

      {/* ───────── HOW BAND ───────── */}
      <section id="how" className="relative border-t border-white/[0.08] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <Eyebrow>Как это работает</Eyebrow>
          <h2 className="font-bebas mt-4 text-[2.5rem] uppercase leading-[1.02] tracking-[0.04em] sm:text-[3.5rem] lg:whitespace-nowrap lg:text-[3.75rem] xl:text-[5rem]">
            Три шага. Один вечер. Никакого кода.
          </h2>

          <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-3">
            <Step num="01" title="Регистрируетесь" text="Почта и пароль — 30 секунд. Сразу попадаете в дашборд и выбираете нишу." />
            <Step num="02" title="Подключаете канал" text="Вставляете токен Telegram-канала (3 клика в @BotFather, инструкция в админке) или вешаете виджет на сайт." />
            <Step num="03" title="AI начинает отвечать" text="Загружаете прайс и расписание одним файлом — ИИ сразу отвечает клиентам и записывает на услугу." />
          </div>
        </div>
      </section>

      {/* ───────── COMPARISON (functional, существующий компонент) ───────── */}
      <section className="relative border-t border-white/[0.08]">
        <ComparisonTable />
      </section>

      {/* ───────── PRICING (functional, существующий компонент) ───────── */}
      <section className="relative border-t border-white/[0.08]">
        <PricingSection />
      </section>

      {/* ───────── FAQ BAND ───────── */}
      <section id="faq" className="relative border-t border-white/[0.08] py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-6">
          <Eyebrow>Частые вопросы</Eyebrow>
          <h2 className="font-bebas mt-4 text-[2.5rem] uppercase leading-[1] tracking-[0.04em] sm:text-[3.5rem]">
            Отвечаем заранее
          </h2>
          <div className="mt-12 divide-y divide-white/[0.08] border-y border-white/[0.08]">
            <Faq q="Сколько времени занимает подключение?">
              15 минут на тарифе Self-Start — регистрация, токен Telegram-канала и загрузка прайса. На тарифе «Под ключ» наш менеджер делает всё за вас за 1 день.
            </Faq>
            <Faq q="Нужно ли быть программистом?">
              Нет. Нужен только токен Telegram-канала — мы покажем, где его взять (3 клика в @BotFather). Услуги, мастеров и расписание заносятся через простые формы.
            </Faq>
            <Faq q="AI правда понимает живой язык?">
              Да. Мы используем Claude — одну из самых сильных AI-моделей в мире. ИИ понимает опечатки, сленг, нестандартные вопросы и контекст диалога.
            </Faq>
            <Faq q="Что, если AI ответит неправильно?">
              Если ИИ не уверен — он сразу пишет вам в Telegram, чтобы вы ответили лично. Все диалоги вы видите в админке и можете вмешаться в любой момент.
            </Faq>
            <Faq q="Работает ли с моим YClients?">
              Да. На тарифе «Под ключ» менеджер всё подключит. На Self-Start — введёте логин/пароль YClients в админке, выберете филиал.
            </Faq>
            <Faq q="Что с моими клиентскими данными?">
              Хранятся в России, соответствуют 152-ФЗ. Третьим лицам не передаём.
            </Faq>
            <Faq q="Можно ли отменить подписку?">
              Да, в один клик прямо в админке. Никаких долгосрочных контрактов.
            </Faq>
          </div>
          <p className="mt-10 text-center text-sm text-white/60">
            Другой вопрос?{' '}
            <a href="mailto:hello@ailiva.ru" className="text-white underline-offset-4 hover:underline">
              hello@ailiva.ru
            </a>
          </p>
        </div>
      </section>

      {/* ───────── FINAL CTA BAND ───────── */}
      <section className="relative flex min-h-[80svh] items-center justify-center border-t border-white/[0.08] py-32">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Eyebrow>Подключите сегодня</Eyebrow>
          <h2 className="font-bebas mx-auto mt-5 max-w-3xl text-[3rem] uppercase leading-[1.02] tracking-[0.04em] sm:text-[6rem]">
            Каждый день без Liva ai —
            <br />
            <span className="text-[#60A5FA]">упущенные клиенты</span>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[15px] leading-[1.6] text-white/70">
            Подключите AI-администратора за 15 минут. Первая 1 000 сообщений — бесплатно. Без карты.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <CtaPrimary href="/register" onClick={() => track('cta_register', { location: 'final_cta' })}>
              Попробовать бесплатно
            </CtaPrimary>
            <CtaGhost href="#pricing" onClick={() => track('cta_turnkey_anchor', { location: 'final_cta' })}>
              Подключим за вас
            </CtaGhost>
          </div>
        </div>
      </section>

      <StickyCta />

      {/* ───────── FOOTER ───────── */}
      <footer className="border-t border-white/[0.08] py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-6 sm:grid-cols-4">
          <div className="col-span-2">
            <Logo size={28} variant="light" />
            <p className="mt-4 max-w-xs text-sm text-white/60">
              AI-администратор для малого бизнеса. Отвечает клиентам и записывает на услугу 24/7.
            </p>
          </div>
          <FooterCol title="Продукт">
            <FooterLink href="#features">Возможности</FooterLink>
            <FooterLink href="#how">Как это работает</FooterLink>
            <FooterLink href="#pricing">Тарифы</FooterLink>
            <FooterLink href="/demo">Демо</FooterLink>
          </FooterCol>
          <FooterCol title="Аккаунт">
            <FooterLink href="/login">Войти</FooterLink>
            <FooterLink href="/register">Регистрация</FooterLink>
            <FooterLink href="/privacy">Политика</FooterLink>
            <FooterLink href="/terms">Условия</FooterLink>
          </FooterCol>
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-col items-start justify-between gap-3 border-t border-white/[0.08] px-6 pt-6 text-xs text-white/50 sm:flex-row">
          <div>© {new Date().getFullYear()} Liva ai</div>
          <div className="uppercase tracking-[0.1em]">Сделано в России</div>
        </div>

        {/* Гигантский outline-wordmark «Liva» на всю ширину — финальный визуальный аккорд */}
        <div
          aria-hidden
          className="font-bebas pointer-events-none mt-16 select-none overflow-hidden text-center uppercase leading-[0.85] tracking-[0.02em]"
          style={{
            color: 'transparent',
            WebkitTextStroke: '1px rgba(255,255,255,0.12)',
            fontSize: 'clamp(8rem, 28vw, 22rem)',
          }}
        >
          Liva
        </div>
      </footer>
    </div>
  );
}

/* ───────── PRIMITIVES ───────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">
      {children}
    </div>
  );
}

function CtaPrimary({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#3B82F6] px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_0_1px_rgba(59,130,246,0.4),0_0_40px_-8px_rgba(59,130,246,0.7)] transition-all hover:bg-[#2563EB] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.6),0_0_60px_-4px_rgba(59,130,246,0.9)]"
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function CtaGhost({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-transparent px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white hover:text-black"
    >
      {children}
    </Link>
  );
}

function TrustCell({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="bg-black p-8">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h3 className="font-bebas mt-3 text-[1.75rem] uppercase leading-[1.05] tracking-[0.04em]">
        {title}
      </h3>
      <p className="mt-4 text-[14px] leading-[1.6] text-white/65">{text}</p>
    </div>
  );
}

function FeatureCell({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-black p-8">
      <h3 className="font-bebas text-[1.5rem] uppercase leading-[1.1] tracking-[0.04em]">{title}</h3>
      <p className="mt-3 text-[14px] leading-[1.6] text-white/65">{text}</p>
    </div>
  );
}

function PainBlock({ pain, gain }: { pain: string; gain: string }) {
  return (
    <div>
      <div className="text-[13px] uppercase tracking-[0.14em] text-white/45">— Проблема</div>
      <p className="mt-3 text-[15px] leading-[1.5] text-white/70">{pain}</p>
      <div className="mt-6 text-[13px] uppercase tracking-[0.14em] text-[#60A5FA]">+ Решение</div>
      <p className="mt-3 text-[15px] leading-[1.5] text-white">{gain}</p>
    </div>
  );
}

function Step({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <div>
      <div className="font-bebas text-[3.5rem] leading-[1] tracking-[0.04em] text-[#60A5FA]">
        {num}
      </div>
      <h3 className="font-bebas mt-4 text-[1.75rem] uppercase leading-[1.05] tracking-[0.04em]">
        {title}
      </h3>
      <p className="mt-3 text-[14px] leading-[1.6] text-white/65">{text}</p>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#60A5FA]" />
      <span>{children}</span>
    </li>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left">
        <span className="font-bebas text-[1.25rem] uppercase tracking-[0.04em]">{q}</span>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center text-white/60 transition-transform group-open:rotate-45">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </summary>
      <div className="pb-5 text-[14px] leading-[1.65] text-white/70">{children}</div>
    </details>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">{title}</div>
      <div className="mt-4 flex flex-col gap-2.5 text-sm text-white/75">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="hover:text-white">
      {children}
    </Link>
  );
}

/* ───────── HEADER ───────── */

function SpaceXHeader() {
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
            <a href="#demo" className="hover:text-white/70">Демо</a>
            <a href="#features" className="hover:text-white/70">Возможности</a>
            <a href="#how" className="hover:text-white/70">Как работает</a>
            <a href="#pricing" className="hover:text-white/70">Тарифы</a>
            <a href="#faq" className="hover:text-white/70">FAQ</a>
            <Link href="/login" className="hover:text-white/70">Войти</Link>
            <Link
              href="/register"
              className="rounded-full border border-white/70 px-5 py-2 text-[11px] hover:bg-white hover:text-black"
            >
              Начать
            </Link>
          </nav>
          <button
            onClick={() => setOpen(true)}
            aria-label="Меню"
            className="md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black md:hidden">
          <div className="flex items-center justify-between px-6 py-5">
            <Logo size={26} variant="light" />
            <button onClick={() => setOpen(false)} aria-label="Закрыть">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col items-center justify-center gap-7 text-[18px] font-bold uppercase tracking-[0.14em]">
            <a href="#demo" onClick={() => setOpen(false)}>Демо</a>
            <a href="#features" onClick={() => setOpen(false)}>Возможности</a>
            <a href="#how" onClick={() => setOpen(false)}>Как работает</a>
            <a href="#pricing" onClick={() => setOpen(false)}>Тарифы</a>
            <a href="#faq" onClick={() => setOpen(false)}>FAQ</a>
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
