import type { Metadata } from 'next';

const title = 'Живое демо Liva ai — попробуйте, как это работает';
const description =
  'Откройте интерактивное демо: слева вы пишете ИИ-администратору как клиент, справа сразу видите, что отображается у владельца в админке. Без регистрации.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: 'https://ailiva.ru/demo',
    siteName: 'Liva ai',
    locale: 'ru_RU',
    type: 'website',
    // OG-картинка автоматически берётся из app/demo/opengraph-image.tsx
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
