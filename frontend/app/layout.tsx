import type { Metadata } from "next";
import { Unbounded, Manrope } from "next/font/google";
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
    <html lang="ru">
      <body
        className={`${unbounded.variable} ${manrope.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Suspense fallback={null}>
          <AnalyticsProvider />
        </Suspense>
      </body>
    </html>
  );
}
