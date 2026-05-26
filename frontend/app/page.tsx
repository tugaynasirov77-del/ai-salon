import Link from 'next/link';
import Script from 'next/script';
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
} from 'lucide-react';
import { PricingSection } from '@/components/landing/PricingSection';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">Liva ai</div>
          <nav className="hidden gap-6 text-sm text-slate-600 sm:flex dark:text-slate-300">
            <a href="#features" className="hover:text-blue-600">Возможности</a>
            <a href="#pricing" className="hover:text-blue-600">Тарифы</a>
            <a href="#demo" className="hover:text-blue-600">Демо</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-blue-600 dark:text-slate-300">
              Войти
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Регистрация
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/20" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
            <Zap className="h-3.5 w-3.5" />
            AI-администратор для малого бизнеса
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 sm:text-6xl dark:text-slate-100">
            Бот, который записывает<br /> клиентов <span className="text-blue-600">за вас</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Liva ai отвечает на сообщения в Telegram, Авито и на сайте 24/7,
            подбирает время и записывает на услугу. Вы видите дашборд с диалогами,
            записями и аналитикой.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Начать бесплатно
            </Link>
            <a
              href="#pricing"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Подключить под ключ
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-500">Без карты. Подключение за 1 день.</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-slate-100 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-slate-100">
            Что умеет Liva ai
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Feature
              icon={<MessageSquare className="h-6 w-6" />}
              title="Принимает заявки везде"
              text="Telegram, MAX, Авито, ВКонтакте, виджет на сайте. Все диалоги в одном окне."
            />
            <Feature
              icon={<Calendar className="h-6 w-6" />}
              title="Записывает на услугу"
              text="AI понимает контекст, подбирает свободное время и мастера, отправляет напоминания за 24 и 2 часа."
            />
            <Feature
              icon={<TrendingUp className="h-6 w-6" />}
              title="Считает деньги"
              text="Дашборд с конверсией, выручкой за период, топ-услугами и расходом токенов на AI."
            />
            <Feature
              icon={<Bot className="h-6 w-6" />}
              title="Учится вашим услугам"
              text="Загрузите прайс, расписание и FAQ — бот настроится под вашу нишу автоматически."
            />
            <Feature
              icon={<Briefcase className="h-6 w-6" />}
              title="9 ниш из коробки"
              text="Салоны красоты, барбершопы, фитнес, клиники, СТО, рестораны, юристы, репетиторы."
            />
            <Feature
              icon={<Check className="h-6 w-6" />}
              title="Эскалация владельцу"
              text="Когда AI не уверен в ответе — присылает вам уведомление в Telegram, чтобы вы ответили лично."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* Demo widget */}
      <section id="demo" className="border-t border-slate-100 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Попробуйте прямо сейчас</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500">
            Виджет демо-салона работает на этой странице. Нажмите на кружок в правом нижнем углу и напишите боту.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <Channel icon={<Send className="h-4 w-4 text-blue-500" />} label="Telegram" />
            <Channel icon={<Globe className="h-4 w-4 text-emerald-500" />} label="Веб-чат" />
            <Channel icon={<Briefcase className="h-4 w-4 text-orange-500" />} label="Авито" />
          </div>
        </div>
        <Script
          src="https://api.ailiva.ru/widget.js?salon=cmpfhd7ha00001s7ud34xwfmw"
          strategy="afterInteractive"
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row">
          <div>© {new Date().getFullYear()} Liva ai</div>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-blue-600">Войти</Link>
            <Link href="/register" className="hover:text-blue-600">Регистрация</Link>
            <a href="mailto:hello@ailiva.ru" className="hover:text-blue-600">hello@ailiva.ru</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

function Channel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm dark:bg-slate-900">
      {icon}
      {label}
    </span>
  );
}
