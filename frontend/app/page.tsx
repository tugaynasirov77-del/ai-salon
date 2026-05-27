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
} from 'lucide-react';
import { NICHES } from '@shared/niches';
import { PricingSection } from '@/components/landing/PricingSection';
import { DemoWidget } from '@/components/landing/DemoWidget';
import { Logo } from '@/components/landing/Logo';
import { SavingsCalculator } from '@/components/landing/SavingsCalculator';
import { ComparisonTable } from '@/components/landing/ComparisonTable';
import { StickyCta } from '@/components/landing/StickyCta';

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
          <nav className="hidden gap-7 text-sm text-slate-300 lg:flex">
            <a href="#features" className="transition-colors hover:text-white">Возможности</a>
            <a href="#how" className="transition-colors hover:text-white">Как это работает</a>
            <a href="#savings" className="transition-colors hover:text-white">Экономия</a>
            <a href="#pricing" className="transition-colors hover:text-white">Тарифы</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
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
              <span className="hidden sm:inline">Попробовать бесплатно</span>
              <span className="sm:hidden">Начать</span>
              <ArrowRight className="h-3.5 w-3.5" />
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

          <h1 className="mx-auto mt-8 max-w-5xl bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-center text-5xl font-semibold tracking-tight text-transparent sm:text-7xl">
            <span className="block">Ваш администратор,</span>
            <span className="block">
              который{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                не спит
              </span>
            </span>
            <span className="mt-2 block text-3xl text-white/70 sm:text-5xl">
              и стоит 2 500 ₽ в месяц
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-400">
            Liva ai отвечает клиентам в Telegram, на Авито и на сайте, записывает на услугу
            и напоминает о визите. Подключение за 15 минут. Работает 24/7 без выходных.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-7 py-3.5 text-base font-semibold text-white shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-transform hover:scale-[1.02] sm:w-auto"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Попробовать бесплатно
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#pricing"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-7 py-3.5 text-base font-medium text-slate-200 backdrop-blur transition-colors hover:bg-white/[0.08] hover:text-white sm:w-auto"
            >
              Подключим за вас за 1 день
            </a>
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

        {/* Dashboard mockup */}
        <div className="relative mx-auto mt-12 max-w-5xl px-4">
          <div className="absolute -inset-x-12 -inset-y-8 -z-10 rounded-[40px] bg-gradient-to-b from-violet-500/20 via-fuchsia-500/10 to-transparent blur-3xl" />
          <DashboardMockup />
        </div>
      </section>

      {/* === Pain → Solution === */}
      <section className="relative py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
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
              gain="Бот отвечает за 3 секунды в любое время суток."
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

      {/* === Features === */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Возможности</span>
            <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              Всё, что делает живой администратор<br className="hidden sm:block" /> — и больше
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Не сценарный бот, а AI, который понимает контекст, записывает на услугу и доводит клиента до визита.
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
          <div className="text-center">
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
              text="Вставляете токен Telegram-бота (3 клика в @BotFather, инструкция в админке) или вешаете виджет на сайт."
            />
            <Step
              num="03"
              title="AI начинает отвечать"
              text="Загружаете прайс и расписание одним файлом — бот сразу отвечает клиентам и записывает на услугу."
            />
          </div>

          <p className="mt-10 text-center text-sm text-slate-500">
            В среднем салоны запускаются за <span className="font-semibold text-white">12 минут</span>
          </p>
        </div>
      </section>

      {/* === Comparison === */}
      <ComparisonTable />

      {/* === Case study === */}
      <section className="relative py-24">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Первый клиент пилота
            </span>
            <h2 className="mt-5 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              «Гараж 161» — автосервис,<br className="hidden sm:block" /> который перестал терять заявки ночью
            </h2>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <CaseStat value="24/7" label="Отвечают клиентам круглосуточно впервые за 6 лет работы" />
            <CaseStat value="+38%" label="Рост заявок в нерабочие часы за первый месяц" />
            <CaseStat value="12 мин" label="Заняло подключение бота с нуля до первого ответа клиенту" />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-8 backdrop-blur-sm sm:p-10">
            <p className="text-xl leading-relaxed text-slate-200 sm:text-2xl">
              «Раньше мы теряли заявки после 19:00 и по воскресеньям. Сейчас бот записывает, а я просто приезжаю и работаю.»
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/40 to-fuchsia-500/40 text-sm font-semibold text-white">С</div>
              <div>
                <div className="text-sm font-medium text-white">Сергей</div>
                <div className="text-xs text-slate-400">основатель автосервиса «Гараж 161», Ростов-на-Дону</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === Savings calculator === */}
      <SavingsCalculator />

      {/* === Niches === */}
      <section className="relative py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
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
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3.5 text-sm text-slate-200 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.05]"
              >
                <span className="text-xl leading-none">{n.icon}</span>
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
          <div className="text-center">
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
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Частые вопросы</span>
            <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              Отвечаем заранее
            </h2>
          </div>
          <div className="mt-12 space-y-3">
            <FaqItem q="Сколько времени занимает подключение?">
              15 минут на тарифе Self-Start — регистрация, токен Telegram-бота и загрузка прайса. На тарифе «Под ключ» наш менеджер делает всё за вас за 1 день.
            </FaqItem>
            <FaqItem q="Нужно ли быть программистом?">
              Нет. Нужен только токен Telegram-бота — мы покажем, где его взять (3 клика в @BotFather). Услуги, мастеров и расписание заносятся через простые формы, как в Excel.
            </FaqItem>
            <FaqItem q="AI правда понимает живой язык?">
              Да. Мы используем Claude — одну из самых сильных AI-моделей в мире. Бот понимает опечатки, сленг, нестандартные вопросы и контекст диалога. Это не сценарное дерево «если—то».
            </FaqItem>
            <FaqItem q="Что, если AI ответит неправильно?">
              Если бот не уверен — он сразу пишет вам в Telegram, чтобы вы ответили лично. Все диалоги вы видите в админке и можете вмешаться в любой момент.
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

      {/* === Demo === */}
      <section id="demo" className="relative py-24">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">Демо</span>
            <h2 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              Попробуйте, как это<br className="hidden sm:block" /> работает изнутри
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Откройте интерактивное демо — слева вы пишете боту как клиент, справа сразу видите, что отображается у владельца в админке. Без регистрации.
            </p>
          </div>

          <Link
            href="/demo"
            className="group relative mx-auto mt-12 block max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/40 via-violet-900/30 to-fuchsia-900/40 p-1 transition-transform hover:scale-[1.01]"
          >
            <div className="rounded-[22px] bg-slate-950/70 p-8 sm:p-12">
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

          <p className="mt-6 text-center text-xs text-slate-500">
            Или нажмите на кружок справа внизу — там тот же бот в формате виджета для сайта.
          </p>
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
                Каждый день без Liva ai —<br className="hidden sm:block" /> это упущенные клиенты после 19:00
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">
                Подключите AI-администратора за 15 минут. Первая 1 000 сообщений — бесплатно. Без карты.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-7 py-3.5 text-base font-semibold text-white shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-transform hover:scale-[1.02] sm:w-auto"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  Попробовать бесплатно
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#pricing"
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
    <div className="group relative bg-slate-950/50 p-7 transition-colors hover:bg-white/[0.04]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-indigo-300 ring-1 ring-inset ring-white/10">
        {icon}
      </div>
      <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

function CaseStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-7 backdrop-blur-sm">
      <div className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-6xl">
        {value}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-400">{label}</p>
    </div>
  );
}

function GuaranteeCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-7 backdrop-blur-sm transition-colors hover:bg-white/[0.04]">
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-7 backdrop-blur-sm transition-colors hover:bg-white/[0.04]">
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
