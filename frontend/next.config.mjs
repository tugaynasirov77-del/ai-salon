import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Разрешаем Next трейсить файлы из родительской папки (нужно для @shared/*)
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
  },
  // ESLint работает локально и в CI, но не должен блокировать prod-сборку Vercel.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
