import type { Metadata } from "next";
import { Unbounded, Manrope, Oswald } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Бренд-типографика: Unbounded (заголовки, геометрический tech-vibe) + Manrope (тело).
// Эквивалент "Tech Startup" pairing с поддержкой кириллицы.
const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});
// SpaceX-redesign: Oswald (condensed sans с поддержкой кириллицы) как
// замена D-DIN-Bold. Bebas Neue без кириллицы, Oswald — самый близкий
// родственник из Google Fonts с RU.
const oswald = Oswald({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-bebas",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ailiva.ru'),
  title: {
    default: 'Liva ai — AI-администратор для малого бизнеса',
    template: '%s · Liva ai',
  },
  description:
    'ИИ-администратор, который отвечает клиентам и записывает на услугу 24/7. Telegram, Авито, YClients, веб-чат — всё в одной админке. Запуск за 15 минут.',
  keywords: [
    'ИИ-администратор', 'AI-администратор', 'автозапись клиентов',
    'ИИ для салона', 'YClients интеграция', 'ИИ-агент Telegram',
    'запись клиентов 24/7', 'малый бизнес AI',
  ],
  openGraph: {
    title: 'Liva ai — ИИ-администратор для малого бизнеса',
    description: 'ИИ-администратор отвечает клиентам и записывает 24/7. Telegram, Авито, YClients, веб-чат. Запуск за 15 минут.',
    url: 'https://ailiva.ru',
    siteName: 'Liva ai',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Liva ai — ИИ-администратор',
    description: 'ИИ-администратор отвечает клиентам и записывает 24/7. Запуск за 15 минут.',
  },
};

import { Suspense } from 'react';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Анти-флэш: ставим .dark до первого пэйнта, по сохранённому выбору
            или системной теме. Идёт ДО любого React-кода. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('liva_theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${unbounded.variable} ${manrope.variable} ${oswald.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Suspense fallback={null}>
          <AnalyticsProvider />
        </Suspense>
      </body>
    </html>
  );
}
