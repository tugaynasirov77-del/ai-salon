'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Calendar,
  BellRing,
  BarChart3,
  Check,
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
import { PricingSection } from '@/components/landing/PricingSection';
import { Logo } from '@/components/landing/Logo';
import { track } from '@/lib/analytics';
import { ComparisonTable } from '@/components/landing/ComparisonTable';
import { StickyCta } from '@/components/landing/StickyCta';
import { ScrollTracker } from '@/components/analytics/ScrollTracker';
import { RevealInit } from '@/components/landing/RevealInit';
import { CountUp } from '@/components/landing/CountUp';
import { TypingDemo } from '@/components/landing/TypingDemo';
import { ScrollProgress } from '@/components/landing/ScrollProgress';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080C14] text-slate-100">
      <ScrollTracker />
      <RevealInit />
      <ScrollProgress />
      {/* === Animated background — синий action-color вшит в атмосферу === */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#080C14]">
        {/* Главный электрический акцент справа сверху — фокус взгляда */}
        <div className="liva-aurora-2 absolute -top-32 -right-40 h-[640px] w-[640px] rounded-full bg-[#3B82F6]/25 blur-[170px]" />
        {/* Холодный сине-стальной слева сверху */}
        <div className="liva-aurora absolute -top-40 -left-40 h-[560px] w-[560px] rounded-full bg-[#38BDF8]/15 blur-[150px]" />
        {/* Спокойный стальной в середине — баланс, чтобы не уйти в попсу */}
        <div className="liva-aurora absolute top-[55%] left-1/4 h-[460px] w-[460px] rounded-full bg-[#8A8E96]/15 blur-[150px]" />
        {/* Глубокий синий внизу справа */}
        <div className="liva-aurora-2 absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-[#2563EB]/15 blur-[160px]" />
        {/* Top glow — усиленный синий */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(96,165,250,0.18),transparent_60%)]" />
        {/* Neural grid */}
        <div className="liva-grid absolute inset-0 opacity-35" />
      </div>

      {/* === Header — плавающая капсула === */}
      <FloatingHeader />

      {/* === Hero === */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            {/* Левая колонка — заявление */}
            <div className="text-center lg:text-left">
              <div className="reveal is-visible inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-slate-300 shadow-[0_0_30px_-8px_rgba(59,130,246,0.5)] backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3B82F6] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3B82F6]" />
                </span>
                <span>Сейчас отвечает клиентам · 24/7</span>
              </div>

              <h1 className="mt-7 text-balance bg-gradient-to-b from-white via-white to-white/55 bg-clip-text text-[2.25rem] font-semibold leading-[1.04] tracking-tight text-transparent sm:text-[3.5rem] lg:text-[4rem]">
                ИИ-администратор, которого клиенты{' '}
                <span className="text-gradient">принимают за человека</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400 lg:max-w-none">
                Отвечает в Telegram, на Авито и на сайте — и сам записывает клиента на услугу за минуту.
              </p>

              <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:items-start lg:justify-start">
                <Link
                  href="/register"
                  onClick={() => track('cta_register', { location: 'hero' })}
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#38BDF8] via-[#3B82F6] to-[#2563EB] px-7 py-3.5 text-base font-semibold text-white shadow-[0_0_50px_-6px_rgba(59,130,246,0.7)] transition-all hover:scale-[1.02] hover:shadow-[0_0_60px_-4px_rgba(96,165,250,0.7)] sm:w-auto"
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
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 transition-colors group-hover:bg-[#3B82F6]/30">
                    <ArrowRight className="h-3 w-3" />
                  </span>
                  Смотреть демо
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 lg:justify-start">
                <BulletBadge>Запуск за 15 минут</BulletBadge>
                <BulletBadge>Данные в России, 152-ФЗ</BulletBadge>
              </div>
            </div>

            {/* Правая колонка — живой чат с лёгким parallax-drift при скролле */}
            <HeroChatParallax>
              {/* Подсветка-glow позади чата */}
              <div className="pointer-events-none absolute inset-0 -z-10 translate-x-6 translate-y-6 rounded-3xl bg-gradient-to-br from-[#3B82F6]/25 via-[#3B82F6]/5 to-transparent blur-2xl" />
              <div className="reveal is-visible overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-2 shadow-[0_30px_80px_-30px_rgba(59,130,246,0.45)] backdrop-blur">
                <TypingDemo />
                {/* Confirmation strip — финальный «✓ записан», чтобы зафиксировать ценность */}
                <div className="mx-1 mb-1 mt-2 flex items-center gap-2.5 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20 ring-1 ring-inset ring-emerald-400/30">
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                  </span>
                  <div className="text-[12.5px] leading-tight">
                    <span className="font-medium text-emerald-200">Запись создана</span>
                    <span className="ml-1.5 text-emerald-300/70">— автоматически попала в YClients</span>
                  </div>
                </div>
              </div>
            </HeroChatParallax>
          </div>
        </div>
      </section>

      {/* === Trust block: три причины спокойно показать продукт клиентам === */}
      <section className="reveal relative border-y border-white/[0.06] bg-white/[0.01] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
            Спокойно показывать клиентам
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Три причины, почему Liva ai не страшно подключить
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            <TrustCard
              eyebrow="Под капотом"
              title="Claude Haiku от Anthropic"
              text="Одна из сильнейших AI-моделей мира — та же семья, что у Cursor и Notion AI. Отвечает как живой администратор: понимает контекст и неформальные формулировки, а не работает по сценарию."
            />
            <TrustCard
              eyebrow="Данные клиентов"
              title="Хранятся в России, 152-ФЗ"
              text="Серверы внутри РФ, шифрование при передаче, разграничение доступа. Соответствует требованиям к обработке персональных данных малого бизнеса."
            />
            <TrustCard
              eyebrow="Уже интегрировано"
              title="YClients, Telegram, Авито"
              text="Подключается к тому, что у вас уже работает. Запись попадает прямо в YClients, ответы идут из вашего Telegram-канала или Авито-аккаунта."
            />
          </div>
        </div>
      </section>

      {/* === Pain → Solution === */}
      <section className="relative py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="reveal text-center">
            {/* Editorial-голос: меньше H2, цветной opener, длинная строка как pull-quote */}
            <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">Знакомо</span>
            <h2 className="mx-auto mt-4 max-w-3xl text-balance text-[1.65rem] font-medium leading-[1.25] text-slate-200 sm:text-[2rem]">
              <span className="text-white">Каждое неотвеченное сообщение</span>{' '}
              <span className="text-slate-400">— это клиент, который ушёл к конкуренту.</span>
            </h2>
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
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C0C4CB]">Демо</span>
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
            className="border-gradient reveal group relative mx-auto mt-12 block max-w-3xl overflow-hidden rounded-3xl border border-[#3B82F6]/20 bg-gradient-to-br from-[#3B82F6]/12 via-[#3B82F6]/6 to-transparent p-1 transition-all duration-300 hover:scale-[1.01] hover:border-[#3B82F6]/35 hover:shadow-[0_20px_70px_-20px_rgba(59,130,246,0.55)]"
          >
            <div className="relative rounded-[22px] bg-[#080C14]/70 p-6 sm:p-10">
              <div className="grid items-center gap-8 sm:grid-cols-2 sm:gap-10">
                {/* Живой печатающийся чат */}
                <div className="order-2 sm:order-1">
                  <TypingDemo />
                </div>

                {/* Текст + CTA */}
                <div className="order-1 text-center sm:order-2 sm:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                    <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
                    Реальный AI на Claude
                  </div>
                  <div className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
                    Так выглядит диалог с клиентом
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Слева — живой пример. В полном демо вы сами пишете ИИ-администратору, а справа в реальном времени видите, что появляется у владельца в админке.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs sm:justify-start">
                    <Channel icon={<Send className="h-3.5 w-3.5" />} label="Telegram" tone="indigo" />
                    <Channel icon={<Globe className="h-3.5 w-3.5" />} label="Веб-чат" tone="emerald" />
                    <Channel icon={<Briefcase className="h-3.5 w-3.5" />} label="Авито" tone="orange" />
                    <Channel icon={<Calendar className="h-3.5 w-3.5" />} label="YClients" tone="cyan" />
                  </div>

                  <span className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#3B82F6] to-[#2563EB] px-6 py-3.5 text-base font-semibold text-white shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-transform group-hover:scale-[1.03]">
                    Открыть полное демо
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* === Features === */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="reveal text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C0C4CB]">Возможности</span>
            <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              Всё, что делает живой администратор<br className="hidden sm:block" /> — и больше
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Не сценарий «если—то», а ИИ-агент, который понимает контекст, записывает на услугу и доводит клиента до визита.
            </p>
          </div>
          <SpotlightGrid>
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
              text="Автоматические напоминания клиенту за сутки и за 2 часа до визита. Меньше пустых слотов и забывших про запись."
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
          </SpotlightGrid>
        </div>
      </section>

      {/* === How it works === */}
      <section id="how" className="relative py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="reveal text-center">
            {/* Manifesto-голос: один большой выдох, no eyebrow, шире tracking */}
            <h2 className="mx-auto max-w-4xl text-balance bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-5xl font-semibold leading-[1.02] tracking-[-0.03em] text-transparent sm:text-7xl">
              Три шага. Один вечер. Никакого кода.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base text-slate-400">
              Подключение Liva ai проще, чем настройка Wi-Fi в кафе.
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
            На Self-Start реально запуститься за вечер. На «Под ключ» — мы делаем всё сами.
          </p>
        </div>
      </section>

      {/* === Comparison === */}
      <ComparisonTable />

      {/* === Pricing === */}
      <PricingSection />

      {/* === FAQ === */}
      <section id="faq" className="relative py-24">
        <div className="mx-auto max-w-3xl px-4">
          <div className="reveal text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C0C4CB]">Частые вопросы</span>
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
            <a href="mailto:hello@ailiva.ru" className="text-[#C0C4CB] hover:text-white">
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
          <div className="border-gradient reveal relative overflow-hidden rounded-3xl border border-[#3B82F6]/25 bg-gradient-to-br from-[#3B82F6]/15 via-[#3B82F6]/8 to-transparent p-10 text-center sm:p-14">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-[#3B82F6]/30 blur-[100px]" />
            <div className="absolute -bottom-32 left-1/4 h-[260px] w-[460px] rounded-full bg-[#38BDF8]/15 blur-[110px]" />
            <div className="relative">
              <h2 className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
                Каждый день без Liva ai —<br className="hidden sm:block" /> это упущенные клиенты
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">
                Подключите AI-администратора за 15 минут. Первая 1 000 сообщений — бесплатно. Без карты.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  onClick={() => track('cta_register', { location: 'final_cta' })}
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#3B82F6] to-[#2563EB] px-7 py-3.5 text-base font-semibold text-white shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-transform hover:scale-[1.02] sm:w-auto"
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

function SpotlightGrid({ children }: { children: React.ReactNode }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--x', `${e.clientX - r.left}px`);
    el.style.setProperty('--y', `${e.clientY - r.top}px`);
  }

  return (
    <div ref={setEl} onMouseMove={onMove} className="group reveal relative mt-16">
      {/* Spotlight, следующий за курсором */}
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(260px circle at var(--x) var(--y), rgba(96,165,250,0.10), transparent 65%)',
        }}
      />
      <div className="relative grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="group relative bg-[#080C14]/40 p-7 transition-colors duration-300 hover:bg-white/[0.04]">
      {/* hover glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(96,165,250,0.12),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#C0C4CB]/20 via-[#8A8E96]/20 to-[#5A5E66]/20 text-[#E8EBEF] ring-1 ring-inset ring-white/10 transition-all duration-300 group-hover:ring-[#C0C4CB]/40 group-hover:shadow-[0_0_24px_-4px_rgba(96,165,250,0.6)]">
        {icon}
      </div>
      <h3 className="relative mt-5 text-base font-semibold text-white">{title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

function FloatingHeader() {
  return (
    <header className="fixed inset-x-0 top-3 z-40 px-3 sm:top-5 sm:px-4">
      <div className="relative mx-auto max-w-4xl">
        {/* Свечение под капсулой */}
        <div className="pointer-events-none absolute -inset-x-10 -top-6 -z-10 h-24 bg-[radial-gradient(ellipse_50%_100%_at_50%_0%,rgba(59,130,246,0.4),transparent_70%)] blur-xl" />
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#080C14]/40 px-3 py-2.5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md sm:rounded-full sm:px-5">
          <Logo size={30} variant="light" />
          <nav className="hidden gap-7 text-sm text-slate-300 lg:flex">
            <a href="#demo" className="transition-colors hover:text-white">Демо</a>
            <a href="#features" className="transition-colors hover:text-white">Возможности</a>
            <a href="#how" className="transition-colors hover:text-white">Как это работает</a>
            <a href="#pricing" className="transition-colors hover:text-white">Тарифы</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="hidden text-sm font-medium text-slate-300 transition-colors hover:text-white sm:inline">
              Войти
            </Link>
            <Link
              href="/register"
              onClick={() => track('cta_register', { location: 'header' })}
              className="group relative hidden items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-[#38BDF8] via-[#3B82F6] to-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_-4px_rgba(59,130,246,0.7)] transition-transform hover:scale-[1.03] sm:inline-flex"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Попробовать бесплатно
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
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
            className="absolute inset-0 bg-[#080C14]/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div className="absolute inset-x-0 top-0 border-b border-white/10 bg-[#080C14]/95 px-4 pb-6 pt-4 shadow-2xl backdrop-blur-xl">
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#3B82F6] to-[#2563EB] px-6 py-3 text-base font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.45)]"
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

// Parallax-обёртка для hero-чата: лёгкий drift вверх + scale-вниз при скролле первого экрана.
// rAF + `transform`, никаких rerender'ов компонента-ребёнка. Уважает prefers-reduced-motion.
function HeroChatParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let pending = false;

    function update() {
      pending = false;
      // Прогресс скролла: 0 на самом верху, 1 когда проскроллили один viewport.
      const p = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
      // Drift: до -28px вверх. Scale: до 0.97. Opacity лёгкий fade при уходе.
      const ty = -p * 28;
      const scale = 1 - p * 0.03;
      const opacity = 1 - p * 0.15;
      if (el) {
        el.style.transform = `translate3d(0, ${ty}px, 0) scale(${scale})`;
        el.style.opacity = String(opacity);
      }
    }

    function onScroll() {
      if (pending) return;
      pending = true;
      raf = requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative will-change-transform"
      style={{ transformOrigin: 'center top' }}
    >
      {children}
    </div>
  );
}

function TrustCard({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 transition-colors hover:border-white/[0.14]">
      {/* Subtle blue accent halo on hover */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#3B82F6]/0 blur-3xl transition-colors duration-500 group-hover:bg-[#3B82F6]/15" />
      <div className="relative">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#60A5FA]">{eyebrow}</div>
        <div className="mt-2 text-lg font-semibold text-white">{title}</div>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
      </div>
    </div>
  );
}

function FloatingDemoLink() {
  return (
    <Link
      href="/demo"
      onClick={() => track('cta_demo', { location: 'floating' })}
      aria-label="Открыть полное демо"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#3B82F6] via-[#3B82F6] to-[#2563EB] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_-4px_rgba(59,130,246,0.6)] backdrop-blur-xl transition-transform hover:scale-[1.03] sm:bottom-6 sm:right-6 sm:px-5 sm:py-3.5"
    >
      <MessageSquare className="h-4 w-4" strokeWidth={2} />
      <span className="hidden sm:inline">Открыть демо</span>
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
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
  indigo: 'border-[#C0C4CB]/30 bg-[#8A8E96]/10 text-[#E8EBEF]',
  emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  orange: 'border-orange-400/30 bg-orange-500/10 text-orange-200',
  cyan: 'border-[#C0C4CB]/30 bg-[#8A8E96]/10 text-[#E8EBEF]',
};

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
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-slate-400 transition-transform group-open:rotate-45 group-open:border-[#8A8E96] group-open:text-[#C0C4CB]">
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
