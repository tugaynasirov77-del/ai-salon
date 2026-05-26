import Link from 'next/link';
import {
  MessageSquare,
  Calendar,
  TrendingUp,
  Check,
  Zap,
  Briefcase,
  Bot,
  Globe,
  Send,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { PricingSection } from '@/components/landing/PricingSection';
import { DemoWidget } from '@/components/landing/DemoWidget';
import { Logo } from '@/components/landing/Logo';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* === Backgrоund-noise + ambient blobs (фиксированные) === */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 -left-40 h-[520px] w-[520px] rounded-full bg-indigo-600/30 blur-[140px]" />
        <div className="absolute top-[18%] -right-32 h-[480px] w-[480px] rounded-full bg-fuchsia-600/25 blur-[140px]" />
        <div className="absolute top-[60%] left-1/3 h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08),transparent_60%)]" />
        {/* Grid noise */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          }}
        />
      </div>

      {/* === Header === */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo size={32} variant="light" />
          <nav className="hidden gap-8 text-sm text-slate-300 sm:flex">
            <a href="#features" className="transition-colors hover:text-white">Возможности</a>
            <a href="#how" className="transition-colors hover:text-white">Как это работает</a>
            <a href="#pricing" className="transition-colors hover:text-white">Тарифы</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
            <a href="#demo" className="transition-colors hover:text-white">Демо</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
              Войти
            </Link>
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.45)] transition-transform hover:scale-[1.02]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Регистрация
            </Link>
          </div>
        </div>
      </header>

      {/* === Hero === */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 pt-24 pb-28 text-center sm:pt-32 sm:pb-36">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-fuchsia-500" />
            </span>
            <span>AI-администратор для малого бизнеса</span>
          </div>

          <h1 className="mx-auto mt-8 max-w-4xl bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-center text-5xl font-semibold tracking-tight text-transparent sm:text-7xl">
            <span className="block">Бот, который записывает</span>
            <span className="block">
              клиентов{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                за вас
              </span>
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-400">
            Liva ai отвечает на сообщения в Telegram, Авито и на сайте 24/7,
            подбирает время и записывает на услугу. Вы видите дашборд с диалогами,
            записями и аналитикой.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-7 py-3.5 text-base font-semibold text-white shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-transform hover:scale-[1.02]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Начать бесплатно
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-7 py-3.5 text-base font-medium text-slate-200 backdrop-blur transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              Подключить под ключ
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-500">Без карты. Подключение за 1 день.</p>

          {/* Bullet badges */}
          <div className="mx-auto mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-400">
            <BulletBadge>Запуск за 15 минут</BulletBadge>
            <BulletBadge>Отмена в любой момент</BulletBadge>
            <BulletBadge>Поддержка на русском</BulletBadge>
            <BulletBadge>Платёж в рублях</BulletBadge>
          </div>
        </div>
      </section>

      {/* === Features === */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Возможности</span>
            <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              Всё, что нужно <br /> для автоматизации записи
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Один AI-агент закрывает работу администратора: переписка, запись, напоминания, аналитика.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:grid-cols-3">
            <Feature
              icon={<MessageSquare className="h-5 w-5" />}
              title="Принимает заявки везде"
              text="Telegram, Авито, YClients, виджет на сайте. Все диалоги в одном окне."
            />
            <Feature
              icon={<Calendar className="h-5 w-5" />}
              title="Записывает на услугу"
              text="AI понимает контекст, подбирает свободное время и мастера, отправляет напоминания за 24 и 2 часа."
            />
            <Feature
              icon={<TrendingUp className="h-5 w-5" />}
              title="Считает деньги"
              text="Конверсия, выручка за период, топ-услуги и расход токенов на AI — в одном дашборде."
            />
            <Feature
              icon={<Bot className="h-5 w-5" />}
              title="Учится вашему бизнесу"
              text="Загрузите прайс, расписание и FAQ — бот настроится под вашу нишу автоматически."
            />
            <Feature
              icon={<Briefcase className="h-5 w-5" />}
              title="9 ниш из коробки"
              text="Салоны красоты, барбершопы, фитнес, клиники, СТО, рестораны, юристы, репетиторы."
            />
            <Feature
              icon={<Sparkles className="h-5 w-5" />}
              title="Эскалация владельцу"
              text="Когда AI не уверен в ответе — пишет вам в Telegram, чтобы вы ответили лично."
            />
          </div>
        </div>
      </section>

      {/* === How it works === */}
      <section id="how" className="relative py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Как это работает</span>
            <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              От регистрации <br /> до первой записи — 15 минут
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Никакого программирования. Всё через простую админку с подсказками.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Step
              num="01"
              title="Зарегистрируйтесь"
              text="Создайте салон за 2 минуты: email, телефон, ниша. Вы сразу попадаете в дашборд."
            />
            <Step
              num="02"
              title="Подключите Telegram-бота"
              text="Создайте бота через @BotFather (3 клика, инструкция в админке), вставьте токен."
            />
            <Step
              num="03"
              title="Загрузите услуги"
              text="Добавьте прайс, мастеров и расписание. AI начнёт принимать заявки и записывать клиентов."
            />
          </div>
        </div>
      </section>

      {/* === Pricing === */}
      <PricingSection />

      {/* === FAQ === */}
      <section id="faq" className="relative py-24">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Частые вопросы</span>
            <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              Отвечаем заранее
            </h2>
          </div>
          <div className="mt-12 space-y-3">
            <FaqItem q="Нужны ли технические навыки?">
              Нет. Подключение бота — 3 клика по инструкции. Заносить услуги и мастеров можно как в Excel, через простые формы.
            </FaqItem>
            <FaqItem q="Подойдёт ли мне, если у меня не салон, а кафе или СТО?">
              Подойдёт. Liva ai из коробки настроена под 9 ниш: салоны красоты, барбершопы, фитнес-клубы, медцентры, СТО, рестораны, юристы, репетиторы и др. AI адаптируется под ваш прайс и расписание.
            </FaqItem>
            <FaqItem q="Можно ли отменить подписку?">
              Да, в любой момент через кнопку в админке. Никаких долгосрочных контрактов. Деньги за неиспользованный период не сгорают.
            </FaqItem>
            <FaqItem q="А если AI ответит неправильно?">
              Когда AI не уверен — он сразу пишет вам в Telegram, чтобы вы ответили лично. Все диалоги вы видите в админке, можете вмешаться в любой момент.
            </FaqItem>
            <FaqItem q="Сколько стоят сообщения сверх лимита?">
              На тарифе Self-Start: 1000 сообщений в месяц включено. Сверх — обсуждаем индивидуально, обычно дешевле смены тарифа. На «Под ключ» первые 3 месяца — безлимит.
            </FaqItem>
            <FaqItem q="Как подключить YClients?">
              На «Под ключ» — менеджер сделает всё за вас. На Self-Start — введёте логин/пароль YClients в админке, выберете филиал, и Liva ai сама синхронизирует услуги и мастеров.
            </FaqItem>
            <FaqItem q="Где хранятся данные клиентов?">
              На наших серверах в РФ. Не передаются третьим лицам. Клиентам не звоним и не пишем без вашего согласия.
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

      {/* === Demo === */}
      <section id="demo" className="relative py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">Демо</span>
          <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
            Попробуйте прямо <br /> сейчас
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Виджет демо-салона работает на этой странице. Нажмите на кружок справа внизу и напишите боту любой вопрос — он ответит как живой администратор.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs">
            <Channel icon={<Send className="h-4 w-4" />} label="Telegram" tone="indigo" />
            <Channel icon={<Globe className="h-4 w-4" />} label="Веб-чат" tone="emerald" />
            <Channel icon={<Briefcase className="h-4 w-4" />} label="Авито" tone="orange" />
            <Channel icon={<Calendar className="h-4 w-4" />} label="YClients" tone="cyan" />
          </div>
        </div>
        <DemoWidget />
      </section>

      {/* === CTA === */}
      <section className="relative py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/40 via-violet-900/30 to-fuchsia-900/40 p-10 text-center sm:p-14">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-fuchsia-500/20 blur-[100px]" />
            <div className="relative">
              <h2 className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
                Запустите AI-администратора <br /> уже сегодня
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">
                15 минут на регистрацию, подключение Telegram и загрузку услуг — и бот начинает отвечать клиентам.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-7 py-3.5 text-base font-semibold text-white shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-transform hover:scale-[1.02]"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  Зарегистрироваться
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-7 py-3.5 text-base font-medium text-slate-200 transition-colors hover:bg-white/[0.08]"
                >
                  Оставить заявку
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

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
        <div className="mx-auto mt-8 max-w-6xl border-t border-white/[0.06] px-4 pt-6 text-center text-xs text-slate-500 sm:text-left">
          © {new Date().getFullYear()} Liva ai — AI-администратор для малого бизнеса
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="group relative bg-slate-950/50 p-7 transition-colors hover:bg-white/[0.04]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-indigo-300 ring-1 ring-inset ring-white/10">
        {icon}
      </div>
      <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
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

function Step({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[0.025] p-7 backdrop-blur-sm transition-colors hover:bg-white/[0.04]">
      <div
        className="bg-gradient-to-br from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text font-semibold text-transparent"
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
