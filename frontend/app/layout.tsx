import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ailiva.ru'),
  title: {
    default: 'Liva ai — AI-администратор для малого бизнеса',
    template: '%s · Liva ai',
  },
  description:
    'AI-бот, который отвечает клиентам и записывает на услугу 24/7. Telegram, Авито, YClients, веб-чат — всё в одной админке. Запуск за 15 минут.',
  keywords: [
    'AI-администратор', 'автозапись', 'чат-бот для салона',
    'CRM-бот', 'YClients интеграция', 'AI-бот Telegram',
    'запись клиентов', 'малый бизнес AI',
  ],
  openGraph: {
    title: 'Liva ai — AI-администратор для малого бизнеса',
    description: 'AI-бот отвечает клиентам и записывает 24/7. Telegram, Авито, YClients, веб-чат. Запуск за 15 минут.',
    url: 'https://ailiva.ru',
    siteName: 'Liva ai',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Liva ai — AI-администратор',
    description: 'AI-бот отвечает клиентам и записывает 24/7. Запуск за 15 минут.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
