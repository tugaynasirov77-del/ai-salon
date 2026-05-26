import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/register', '/privacy', '/terms'],
        // Закрываем админку и аккаунт-страницы — это персональный кабинет, не для индексации.
        disallow: ['/dashboard', '/dashboard/*', '/api/*'],
      },
    ],
    sitemap: 'https://ailiva.ru/sitemap.xml',
    host: 'https://ailiva.ru',
  };
}
