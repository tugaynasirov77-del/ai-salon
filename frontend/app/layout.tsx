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
