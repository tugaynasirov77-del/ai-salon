'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Calendar,
  BellRing,
  BarChart3,
  Check,
  Zap,
  Briefcase,
  Bot,
  Globe,
  Send,
  ArrowRight,
  Sparkles,
  UserCog,
  Menu,
  X,
} from 'lucide-react';
import { NICHES } from '@shared/niches';
import { PricingSection } from '@/components/landing/PricingSection';
import { Logo } from '@/components/landing/Logo';
import { track } from '@/lib/analytics';
import { SavingsCalculator } from '@/components/landing/SavingsCalculator';
import { ComparisonTable } from '@/components/landing/ComparisonTable';
import { StickyCta } from '@/components/landing/StickyCta';
import { ScrollTracker } from '@/components/analytics/ScrollTracker';
import { RevealInit } from '@/components/landing/RevealInit';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <ScrollTracker />
      <RevealInit />
      {/* === Animated futuristic background (фиксированный) === */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#05060f]">
        {/* Aurora-mesh blobs */}
        <div className="liva-aurora absolute -top-40 -left-40 h-[560px] w-[560px] rounded-full bg-indigo-600/30 blur-[150px]" />
        <div className="liva-aurora-2 absolute top-[12%] -right-40 h-[520px] w-[520px] rounded-full bg-fuchsia-600/25 blur-[150px]" />
        <div className="liva-aurora absolute top-[55%] left-1/4 h-[460px] w-[460px] rounded-full bg-cyan-500/20 blur-[150px]" />
        <div className="liva-aurora-2 absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-[150px]" />
        {/* Top glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(56,189,248,0.10),transparent_60%)]" />
        {/* Neural grid */}
        <div className="liva-grid absolute inset-0 opacity-60" />
      </div>

      {/* === Header === */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo size={32} variant="light" />
          <nav className="hidden gap-7 text-sm text-slate-300 lg:flex">
            <a href="#demo" className="transition-colors hover:text-white">Демо</a>
            <a href="#features" className="transition-colors hover:text-white">Возможности</a>
            <a href="#how" className="transition-colors hover:text-white">Как это работает</a>
            <a href="#pricing" className="transition-colors hover:text-white">Тарифы</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-medium text-slate-300 transition-colors hover:text-white sm:inline">
              Войти
            </Link>
            <Link
              href="/register"
              onClick={() => track('cta_register', { location: 'header' })}
              className="group relative hidden items-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.45)] transition-transform hover:scale-[1.02] sm:inline-flex"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Попробовать бесплатно
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <MobileMenu />
          </div>
        </div>
      </header>

      {/* === Hero === */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 pt-24 pb-28 text-center sm:pt-32 sm:pb-36">
          <div className="reveal is-visible inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-slate-300 shadow-[0_0_30px_-8px_rgba(56,189,248,0.5)] backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            <span>ИИ-администратор для малого бизнеса</span>
          </div>

          <h1 className="mx-auto mt-8 max-w-5xl text-balance bg-gradient-to-b from-white via-white to-white/55 bg-clip-text text-center text-[2rem] font-semibold leading-[1.05] tracking-tight text-transparent sm:text-6xl lg:text-[5rem]">
            <span className="block">Ваш ИИ-администратор,</span>
            <span className="block">
              который{' '}
              <span className="text-gradient">не спит</span>
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-400">
            Liva ai отвечает клиентам в Telegram, на Авито и на сайте, записывает на услугу
            и напоминает о визите. Подключение за 15 минут. Работает 24/7 без выходных.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              onClick={() => track('cta_register', { location: 'hero' })}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500 px-7 py-3.5 text-base font-semibold text-white shadow-[0_0_50px_-6px_rgba(99,102,241,0.7)] transition-all hover:scale-[1.02] hover:shadow-[0_0_60px_-4px_rgba(56,189,248,0.7)] sm:w-auto"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Попробовать бесплатно
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/demo"
              onClick={() => track('cta_demo', { location: 'hero' })}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-7 py-3.5 text-base font-medium text-slate-200 backdrop-blur transition-colors hover:border-white/25 hover:bg-white/[0.07] hover:text-white sm:w-auto"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 transition-colors group-hover:bg-cyan-400/20">
                <ArrowRight className="h-3 w-3" />
              </span>
              Смотреть демо
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-500">
            Без карты · 1 000 сообщений в подарок · Отмена в один клик
          </p>

          {/* Bullet badges */}
          <div className="mx-auto mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-400">
            <BulletBadge>Запуск за 15 минут</BulletBadge>
            <BulletBadge>AI на Claude — не сценарий</BulletBadge>
            <BulletBadge>Данные в России, 152-ФЗ</BulletBadge>
            <BulletBadge>Отмена в один клик</BulletBadge>
          </div>
        </div>

        {/* Interactive 3D dashboard mockup + floating windows */}
        <InteractiveMockup />
      </section>

      {/* === Trust / Channels bar === */}
      <section className="reveal relative border-y border-white/[0.06] bg-white/[0.01] py-9">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 lg:flex-row lg:justify-between lg:gap-10">
          {/* Honest trust signal вместо «1000+ компаний» */}
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 ring-1 ring-inset ring-white/10">
              <Sparkles className="h-4 w-4 text-cyan-300" strokeWidth={1.5} />
            </span>
            <div className="text-left">
              <div className="text-sm font-semibold text-white">Работает на Claude</div>
              <div className="text-xs text-slate-500">одна из сильнейших AI-моделей мира</div>
            </div>
          </div>

          <div className="hidden h-8 w-px bg-white/10 lg:block" />

          <div className="flex flex-1 flex-col items-center gap-4">
            <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
              Работает там, где ваши клиенты
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-slate-300">
              <ChannelBadge icon={<Send className="h-4 w-4" />} name="Telegram" />
              <ChannelBadge icon={<Briefcase className="h-4 w-4" />} name="Авито" />
              <ChannelBadge icon={<Calendar className="h-4 w-4" />} name="YClients" />
              <ChannelBadge icon={<MessageSquare className="h-4 w-4" />} name="WhatsApp" />
              <ChannelBadge icon={<Globe className="h-4 w-4" />} name="Веб-чат" />
            </div>
          </div>
        </div>
      </section>

      {/* === Pain → Solution === */}
      <section className="relative py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="reveal text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">Знакомо?</span>
            <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              Малый бизнес теряет до 40% заявок<br className="hidden sm:block" /> просто потому, что некому ответить
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Каждая упущенная заявка — это не вернувшийся клиент. Каждый администратор — это 35–50 тыс ₽ в месяц. Liva ai закрывает обе боли.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <PainCard
              pain="Клиент написал в 22:30 — ответили утром. Он ушёл к конкуренту."
              gain="ИИ отвечает за 3 секунды в любое время суток."
            />
            <PainCard
              pain="Администратор за 45 000 ₽ болеет, в отпуске, увольняется."
              gain="Liva ai работает 365 дней в году. 2 500 ₽/мес."
            />
            <PainCard
              pain="Диалоги в трёх мессенджерах — половину забываете."
              gain="Telegram, Авито, веб-чат и записи в одной админке."
            />
          </div>
        </div>
      </section>

      {/* === Demo === */}
      <section id="demo" className="relative py-24">
        <div className="mx-auto max-w-5xl px-4">
          <div className="reveal text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">Демо</span>
            <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              Попробуйте, как это<br className="hidden sm:block" /> работает изнутри
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Откройте интерактивное демо — слева вы пишете ИИ-администратору как клиент, справа сразу видите, что отображается у владельца в админке. Без регистрации.
            </p>
          </div>

          <Link
            href="/demo"
            onClick={() => track('cta_demo', { location: 'demo_card' })}
            className="border-gradient reveal group relative mx-auto mt-12 block max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/40 via-violet-900/30 to-fuchsia-900/40 p-1 transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_20px_70px_-20px_rgba(56,189,248,0.5)]"
          >
            <div className="relative rounded-[22px] bg-slate-950/70 p-8 sm:p-12">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-stretch sm:justify-between sm:gap-10">
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                    <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
                    Реальный AI на Claude
                  </div>
                  <div className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
                    Открыть полное демо
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Чат + админка владельца на одном экране. Ваш диалог появится в админке в реальном времени.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-6 py-3.5 text-base font-semibold text-white shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-transform group-hover:scale-[1.03]">
                    Открыть демо
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs sm:justify-start">
                <Channel icon={<Send className="h-4 w-4" />} label="Telegram" tone="indigo" />
                <Channel icon={<Globe className="h-4 w-4" />} label="Веб-чат" tone="emerald" />
                <Channel icon={<Briefcase className="h-4 w-4" />} label="Авито" tone="orange" />
                <Channel icon={<Calendar className="h-4 w-4" />} label="YClients" tone="cyan" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* === Features === */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="reveal text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Возможности</span>
            <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              Всё, что делает живой администратор<br className="hidden sm:block" /> — и больше
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Не сценарий «если—то», а ИИ-агент, который понимает контекст, записывает на услугу и доводит клиента до визита.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:grid-cols-3">
            <Feature
              icon={<Bot className="h-5 w-5" />}
              title="AI на Claude — не сценарий"
              text="Отвечает на нестандартные вопросы, понимает опечатки и контекст. Не «зависает» на фразе вне сценария."
            />
            <Feature
              icon={<Calendar className="h-5 w-5" />}
              title="Запись в YClients"
              text="Свободные слоты, мастера, услуги — синхронно с вашим расписанием. Запись падает прямо в YClients."
            />
            <Feature
              icon={<BellRing className="h-5 w-5" />}
              title="Напоминания 24 и 2 часа"
              text="Автоматические напоминания клиенту за сутки и за 2 часа. Снижает неявки до 60%."
            />
            <Feature
              icon={<UserCog className="h-5 w-5" />}
              title="Эскалация владельцу"
              text="Если AI не уверен в ответе — сразу пишет вам в Telegram. Вы всегда в курсе и можете ответить лично."
            />
            <Feature
              icon={<Sparkles className="h-5 w-5" />}
              title="9 ниш из коробки"
              text="Салоны, барбершопы, фитнес, клиники, СТО, рестораны, юристы, репетиторы и другое."
            />
            <Feature
              icon={<BarChart3 className="h-5 w-5" />}
              title="Аналитика в реальном времени"
              text="Сколько диалогов и записей, конверсия, топ-услуги и какие вопросы клиенты задают чаще всего."
            />
          </div>
        </div>
      </section>

      {/* === How it works === */}
      <section id="how" className="relative py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="reveal text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Как это работает</span>
            <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              Запуск проще, чем настройка<br className="hidden sm:block" /> Wi-Fi в кафе
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Три шага. Никакого программирования. Всё через админку с подсказками.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Step
              num="01"
              title="Регистрируетесь"
              text="Почта и пароль — 30 секунд. Сразу попадаете в дашборд и выбираете нишу."
            />
            <Step
              num="02"
              title="Подключаете канал"
              text="Вставляете токен Telegram-канала (3 клика в @BotFather, инструкция в админке) или вешаете виджет на сайт."
            />
            <Step
              num="03"
              title="AI начинает отвечать"
              text="Загружаете прайс и расписание одним файлом — ИИ сразу отвечает клиентам и записывает на услугу."
            />
          </div>

          <p className="mt-10 text-center text-sm text-slate-500">
            В среднем салоны запускаются за <span className="font-semibold text-white">12 минут</span>
          </p>
        </div>
      </section>

      {/* === Comparison === */}
      <ComparisonTable />

      {/* === Savings calculator === */}
      <SavingsCalculator />

      {/* === Niches === */}
      <section className="relative py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="reveal text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">9 ниш</span>
            <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              Готовые пресеты<br className="hidden sm:block" /> под ваш бизнес
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Для каждой ниши — свой системный промпт, шаблоны напоминаний, набор полей записи и FAQ.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.values(NICHES).map((n: any) => (
              <div
                key={n.key}
                className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3.5 text-sm text-slate-200 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/[0.05] hover:shadow-[0_8px_30px_-12px_rgba(56,189,248,0.5)]"
              >
                <span className="text-xl leading-none transition-transform duration-300 group-hover:scale-110">{n.icon}</span>
                <span>{n.label}</span>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-400">
            Не нашли свою? <span className="font-medium text-white">Liva ai настраивается под любую нишу за 1 день</span> — просто оставьте заявку.
          </p>
        </div>
      </section>

      {/* === Pricing === */}
      <PricingSection />

      {/* === Guarantees === */}
      <section className="relative py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="reveal text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Гарантии</span>
            <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              Вы ничем не рискуете
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Никаких долгосрочных контрактов и скрытых условий. Уходите когда хотите, деньги за неиспользованный период вернём.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <GuaranteeCard
              icon="↺"
              title="Отмена в один клик"
              text="Без долгосрочных контрактов. Уходите когда хотите — прямо в админке, без звонков и писем."
            />
            <GuaranteeCard
              icon="₽"
              title="Возврат за неиспользованный период"
              text="Решите остановиться — вернём деньги за оставшиеся дни оплаченного периода."
            />
            <GuaranteeCard
              icon="🇷🇺"
              title="Данные в России, 152-ФЗ"
              text="Все данные клиентов хранятся на серверах в РФ. Третьим лицам не передаём. Полный текст — в Политике."
            />
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      <section id="faq" className="relative py-24">
        <div className="mx-auto max-w-3xl px-4">
          <div className="reveal text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Частые вопросы</span>
            <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              Отвечаем заранее
            </h2>
          </div>
          <div className="mt-12 space-y-3">
            <FaqItem q="Сколько времени занимает подключение?">
              15 минут на тарифе Self-Start — регистрация, токен Telegram-канала и загрузка прайса. На тарифе «Под ключ» наш менеджер делает всё за вас за 1 день.
            </FaqItem>
            <FaqItem q="Нужно ли быть программистом?">
              Нет. Нужен только токен Telegram-канала — мы покажем, где его взять (3 клика в @BotFather). Услуги, мастеров и расписание заносятся через простые формы, как в Excel.
            </FaqItem>
            <FaqItem q="AI правда понимает живой язык?">
              Да. Мы используем Claude — одну из самых сильных AI-моделей в мире. ИИ понимает опечатки, сленг, нестандартные вопросы и контекст диалога. Это не сценарное дерево «если—то».
            </FaqItem>
            <FaqItem q="Что, если AI ответит неправильно?">
              Если ИИ не уверен — он сразу пишет вам в Telegram, чтобы вы ответили лично. Все диалоги вы видите в админке и можете вмешаться в любой момент.
            </FaqItem>
            <FaqItem q="Работает ли с моим YClients?">
              Да. На тарифе «Под ключ» менеджер всё подключит. На Self-Start — введёте логин/пароль YClients в админке, выберете филиал, и Liva ai сама синхронизирует услуги, мастеров и расписание.
            </FaqItem>
            <FaqItem q="Подойдёт ли мне, если у меня не салон?">
              Подойдёт. Liva ai из коробки настроена под 9 ниш: салоны, барбершопы, фитнес, клиники, СТО, рестораны, юристы, репетиторы и «Другое». Если ниши нет в списке — настроим под вас за 1 день.
            </FaqItem>
            <FaqItem q="Что с моими клиентскими данными?">
              Хранятся в России, соответствуют 152-ФЗ. Третьим лицам не передаём. Клиентам не звоним и не пишем без вашего согласия.
            </FaqItem>
            <FaqItem q="Можно ли отменить подписку?">
              Да, в один клик прямо в админке. Никаких долгосрочных контрактов. Деньги за неиспользованный оплаченный период вернём.
            </FaqItem>
            <FaqItem q="А если у меня большой поток сообщений?">
              На тарифе «Под ключ» первые 3 месяца — безлимит. Дальше обсудим индивидуально, обычно остаёмся в рамках 2 500 ₽/мес. На Self-Start включено 1 000 сообщений; сверху можно докупить блоками.
            </FaqItem>
          </div>
          <p className="mt-10 text-center text-sm text-slate-400">
            Другой вопрос? Напишите{' '}
            <a href="mailto:hello@ailiva.ru" className="text-violet-300 hover:text-white">
              hello@ailiva.ru
            </a>
          </p>
        </div>
      </section>

      {/* === Floating demo button (corner) === */}
      <FloatingDemoLink />

      {/* === CTA === */}
      <section className="relative py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="border-gradient reveal relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/40 via-violet-900/30 to-fuchsia-900/40 p-10 text-center sm:p-14">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-fuchsia-500/25 blur-[100px]" />
            <div className="absolute -bottom-32 left-1/4 h-[260px] w-[460px] rounded-full bg-cyan-500/15 blur-[110px]" />
            <div className="relative">
              <h2 className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
                Каждый день без Liva ai —<br className="hidden sm:block" /> это упущенные клиенты после 19:00
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">
                Подключите AI-администратора за 15 минут. Первая 1 000 сообщений — бесплатно. Без карты.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  onClick={() => track('cta_register', { location: 'final_cta' })}
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-7 py-3.5 text-base font-semibold text-white shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-transform hover:scale-[1.02] sm:w-auto"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  Попробовать бесплатно
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#pricing"
                  onClick={() => track('cta_turnkey_anchor', { location: 'final_cta' })}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-7 py-3.5 text-base font-medium text-slate-200 transition-colors hover:bg-white/[0.08] sm:w-auto"
                >
                  Подключим за вас
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StickyCta />

      {/* === Footer === */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-2">
            <Logo size={28} variant="light" />
            <p className="mt-4 max-w-xs text-sm text-slate-400">
              AI-администратор для малого бизнеса. Отвечает клиентам и записывает на услугу 24/7.
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Продукт</div>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li><a href="#features" className="hover:text-white">Возможности</a></li>
              <li><a href="#how" className="hover:text-white">Как это работает</a></li>
              <li><a href="#pricing" className="hover:text-white">Тарифы</a></li>
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
              <li><a href="#demo" className="hover:text-white">Демо</a></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Аккаунт</div>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li><Link href="/login" className="hover:text-white">Войти</Link></li>
              <li><Link href="/register" className="hover:text-white">Регистрация</Link></li>
              <li><a href="mailto:hello@ailiva.ru" className="hover:text-white">hello@ailiva.ru</a></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-8 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/[0.06] px-4 pt-6 text-center text-xs text-slate-500 sm:flex-row sm:text-left">
          <div>© {new Date().getFullYear()} Liva ai — AI-администратор для малого бизнеса</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white">Конфиденциальность</Link>
            <Link href="/terms" className="hover:text-white">Оферта</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="group relative bg-slate-950/40 p-7 transition-colors duration-300 hover:bg-white/[0.04]">
      {/* hover glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(56,189,248,0.12),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 via-indigo-500/20 to-fuchsia-500/20 text-cyan-200 ring-1 ring-inset ring-white/10 transition-all duration-300 group-hover:ring-cyan-400/40 group-hover:shadow-[0_0_24px_-4px_rgba(56,189,248,0.6)]">
        {icon}
      </div>
      <h3 className="relative mt-5 text-base font-semibold text-white">{title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

function MobileMenu() {
  const [open, setOpen] = useState(false);
  const links: Array<[string, string]> = [
    ['#demo', 'Демо'],
    ['#features', 'Возможности'],
    ['#how', 'Как это работает'],
    ['#pricing', 'Тарифы'],
    ['#faq', 'FAQ'],
  ];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Открыть меню"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-200 transition-colors hover:bg-white/[0.08] lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div className="absolute inset-x-0 top-0 border-b border-white/10 bg-slate-950/95 px-4 pb-6 pt-4 shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between">
              <Logo size={32} variant="light" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Закрыть меню"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-200 transition-colors hover:bg-white/[0.08]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mx-auto mt-6 flex max-w-6xl flex-col gap-1">
              {links.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  {label}
                </a>
              ))}
            </nav>

            <div className="mx-auto mt-5 flex max-w-6xl flex-col gap-3 border-t border-white/[0.06] pt-5">
              <Link
                href="/register"
                onClick={() => { track('cta_register', { location: 'mobile_menu' }); setOpen(false); }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-6 py-3 text-base font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.45)]"
              >
                Попробовать бесплатно
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-base font-medium text-slate-200 transition-colors hover:bg-white/[0.08]"
              >
                Войти
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ChannelBadge({ icon, name }: { icon: React.ReactNode; name: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-300">
      <span className="text-slate-400">{icon}</span>
      <span>{name}</span>
    </div>
  );
}

function FloatingDemoLink() {
  return (
    <Link
      href="/demo"
      onClick={() => track('cta_demo', { location: 'floating' })}
      aria-label="Открыть полное демо"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_-4px_rgba(139,92,246,0.6)] backdrop-blur-xl transition-transform hover:scale-[1.03] sm:bottom-6 sm:right-6 sm:px-5 sm:py-3.5"
    >
      <MessageSquare className="h-4 w-4" strokeWidth={2} />
      <span className="hidden sm:inline">Открыть демо</span>
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function GuaranteeCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="glass glow-hover reveal rounded-2xl p-7">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 text-xl text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

function PainCard({ pain, gain }: { pain: string; gain: string }) {
  return (
    <div className="glass glow-hover reveal rounded-2xl p-7">
      <p className="text-sm leading-relaxed text-slate-500 line-through decoration-rose-400/40 decoration-1">{pain}</p>
      <div className="my-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <p className="text-base font-medium leading-relaxed text-white">{gain}</p>
    </div>
  );
}

function BulletBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Check className="h-3.5 w-3.5 text-emerald-400" />
      {children}
    </span>
  );
}

const CHANNEL_TONES: Record<string, string> = {
  indigo: 'border-indigo-400/30 bg-indigo-500/10 text-indigo-200',
  emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  orange: 'border-orange-400/30 bg-orange-500/10 text-orange-200',
  cyan: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200',
};

function InteractiveMockup() {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref) return;
    const r = ref.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5; // -0.5..0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -py * 6, ry: px * 8 }); // мягкий наклон до ~6-8deg
  }
  function onLeave() {
    setTilt({ rx: 0, ry: 0 });
  }

  return (
    <div className="relative mx-auto mt-14 max-w-5xl px-4">
      {/* Ambient glow за окном */}
      <div className="absolute -inset-x-12 -inset-y-10 -z-10 rounded-[48px] bg-gradient-to-b from-cyan-500/15 via-violet-500/15 to-transparent blur-3xl" />

      <div
        ref={setRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="relative"
        style={{ perspective: '1400px' }}
      >
        {/* Float layer (только drift по Y) */}
        <div className="liva-float">
          {/* Tilt layer (только rotate; preserve-3d для глубины floating-окон) */}
          <div
            className="relative transition-transform duration-300 ease-out will-change-transform"
            style={{
              transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            <DashboardMockup />

            {/* Floating mini-windows — глубина через translateZ на внешнем слое */}
            <FloatCard className="absolute -left-4 -top-6 hidden w-[230px] sm:block" depth={60} delay="0s">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
                  <Check className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-white">Новая запись</div>
                  <div className="truncate text-[11px] text-slate-400">Анна — маникюр, пт 15:00</div>
                </div>
              </div>
            </FloatCard>

            <FloatCard className="absolute -right-4 top-10 hidden w-[250px] lg:block" depth={90} delay="-2s">
              <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-[11px] font-semibold text-white">К</span>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400">Telegram · сейчас</div>
                  <div className="mt-0.5 rounded-lg rounded-tl-sm bg-white/[0.06] px-2.5 py-1.5 text-[12px] text-slate-100">
                    Запишите на стрижку в субботу 🙏
                  </div>
                </div>
              </div>
            </FloatCard>

            <FloatCard className="absolute -bottom-6 left-12 hidden w-[240px] md:block" depth={50} delay="-4s">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300 ring-1 ring-inset ring-cyan-400/30">
                  <BellRing className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-white">Напоминание отправлено</div>
                  <div className="truncate text-[11px] text-slate-400">За 2 часа до визита</div>
                </div>
              </div>
            </FloatCard>
          </div>
        </div>
      </div>
    </div>
  );
}

// Внешний слой держит translateZ (глубина в 3D), внутренний — float-drift,
// чтобы CSS-анимация не перетёрла inline-transform с translateZ.
function FloatCard({
  children,
  className = '',
  depth = 60,
  delay = '0s',
}: {
  children: React.ReactNode;
  className?: string;
  depth?: number;
  delay?: string;
}) {
  return (
    <div className={className} style={{ transform: `translateZ(${depth}px)` }}>
      <div
        className="glass liva-float rounded-2xl px-3.5 py-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.85)]"
        style={{ animationDelay: delay }}
      >
        {children}
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-[0_30px_80px_-20px_rgba(99,102,241,0.4)] backdrop-blur-xl">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400/60" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/60" />
        <span className="h-3 w-3 rounded-full bg-green-400/60" />
        <div className="ml-3 hidden items-center gap-2 rounded-md bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-400 sm:flex">
          <Globe className="h-3 w-3" />
          ailiva.ru/dashboard
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
        {/* Sidebar */}
        <aside className="hidden border-r border-white/[0.06] bg-white/[0.015] px-3 py-4 md:block">
          <div className="mb-4 px-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Liva ai</div>
            <div className="mt-1 text-sm font-medium text-slate-200">Студия Грация</div>
          </div>
          <div className="space-y-1">
            <MockNavItem active>Главная</MockNavItem>
            <MockNavItem>Диалоги</MockNavItem>
            <MockNavItem>Клиенты</MockNavItem>
            <MockNavItem>Расписание</MockNavItem>
            <MockNavItem>Аналитика</MockNavItem>
          </div>
        </aside>

        {/* Main */}
        <div className="p-5 sm:p-6">
          <div className="text-sm font-semibold text-white">Главная</div>
          <div className="mt-0.5 text-[11px] text-slate-500">Сводка за последние 30 дней</div>

          {/* Metrics */}
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MockMetric label="Записей" value="128" trend="+18%" tone="emerald" />
            <MockMetric label="Выручка" value="247 500 ₽" trend="+24%" tone="emerald" />
            <MockMetric label="Конверсия" value="42%" trend="+6%" tone="indigo" />
            <MockMetric label="Сообщений" value="1 284" trend="" tone="violet" />
          </div>

          {/* Body row */}
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-5">
            {/* Chart */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 lg:col-span-3">
              <div className="text-[11px] font-medium text-slate-300">Записи по дням</div>
              <svg viewBox="0 0 300 100" className="mt-3 h-24 w-full">
                <defs>
                  <linearGradient id="mock-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,75 C30,72 50,55 75,55 C100,55 120,68 150,52 C180,40 210,28 240,32 C270,38 290,22 300,18 L300,100 L0,100 Z"
                  fill="url(#mock-grad)"
                />
                <path
                  d="M0,75 C30,72 50,55 75,55 C100,55 120,68 150,52 C180,40 210,28 240,32 C270,38 290,22 300,18"
                  stroke="#A78BFA"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>

            {/* Recent dialogs */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 lg:col-span-2">
              <div className="mb-3 text-[11px] font-medium text-slate-300">Последние диалоги</div>
              <div className="space-y-2.5">
                <MockDialog name="Анна К." channel="Telegram" text="Записаться на маникюр" time="2 мин" />
                <MockDialog name="Мария В." channel="Авито" text="Сколько стоит стрижка?" time="14 мин" />
                <MockDialog name="Дмитрий" channel="Веб-чат" text="Перенесите запись на завтра" time="42 мин" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockNavItem({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <div
      className={
        active
          ? 'relative rounded-md bg-gradient-to-r from-indigo-500/20 via-violet-500/15 to-fuchsia-500/10 px-2.5 py-1.5 text-[11px] font-medium text-white'
          : 'rounded-md px-2.5 py-1.5 text-[11px] font-medium text-slate-400'
      }
    >
      {active && <span className="absolute left-0 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-400 via-violet-400 to-fuchsia-400" />}
      {children}
    </div>
  );
}

function MockMetric({ label, value, trend, tone = 'indigo' }: { label: string; value: string; trend?: string; tone?: 'emerald' | 'indigo' | 'violet' }) {
  const trendColor = tone === 'emerald' ? 'text-emerald-400' : tone === 'violet' ? 'text-fuchsia-300' : 'text-indigo-300';
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <div className="text-base font-semibold text-white">{value}</div>
        {trend && <div className={`text-[10px] font-medium ${trendColor}`}>{trend}</div>}
      </div>
    </div>
  );
}

function MockDialog({ name, channel, text, time }: { name: string; channel: string; text: string; time: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/40 to-fuchsia-500/40 text-[10px] font-semibold text-white">
        {name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-[11px] font-medium text-slate-200">{name}</div>
          <div className="shrink-0 text-[9px] text-slate-500">{time}</div>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-violet-300">{channel}</span>
          <span className="truncate text-[10px] text-slate-400">{text}</span>
        </div>
      </div>
    </div>
  );
}

function Step({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <div className="glass glow-hover reveal relative rounded-2xl p-7">
      <div
        className="text-gradient font-semibold"
        style={{ fontSize: 56, lineHeight: 1 }}
      >
        {num}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur-sm transition-colors open:bg-white/[0.04]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="text-base font-medium text-white">{q}</span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-slate-400 transition-transform group-open:rotate-45 group-open:border-violet-400 group-open:text-violet-300">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </summary>
      <div className="px-5 pb-4 text-sm leading-relaxed text-slate-300">{children}</div>
    </details>
  );
}

function Channel({ icon, label, tone = 'indigo' }: { icon: React.ReactNode; label: string; tone?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${CHANNEL_TONES[tone]}`}>
      {icon}
      {label}
    </span>
  );
}
