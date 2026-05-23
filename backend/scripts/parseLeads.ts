// Парсер локальных бизнесов через Яндекс.Карты Places API.
// Регистрация ключа: https://developer.tech.yandex.ru/services/3 (Places API → JS API + HTTP Геокодер).
// Бесплатно 500 запросов/день. Этого хватит на парсинг города.
//
// Запуск:
//   YANDEX_API_KEY=xxx npx tsx scripts/parseLeads.ts "Ростов-на-Дону"
//
// Output: /tmp/leads.csv — готов к импорту в Google Sheets.
import { config } from 'dotenv';
config({ override: true });
import fs from 'fs';

const API_KEY = process.env.YANDEX_API_KEY;
const CITY = process.argv[2] || 'Ростов-на-Дону';
const RESULTS_PER_QUERY = 50; // макс по docs = 500, но 50 хватит

if (!API_KEY) {
  console.error('Ошибка: YANDEX_API_KEY не задан в env');
  console.error('Получи здесь: https://developer.tech.yandex.ru/services/3');
  process.exit(1);
}

// Сегменты + поисковые фразы (несколько синонимов, чтобы найти больше)
const SEGMENTS = [
  {
    name: 'СТО',
    queries: ['шиномонтаж', 'автосервис', 'СТО', 'автомастерская', 'кузовной ремонт', 'замена масла'],
  },
  {
    name: 'Барбершоп',
    queries: ['барбершоп', 'мужская парикмахерская', 'мужская стрижка'],
  },
];

type YResult = {
  properties?: {
    name?: string;
    CompanyMetaData?: {
      name?: string;
      address?: string;
      url?: string;
      Phones?: Array<{ type?: string; formatted?: string }>;
      Categories?: Array<{ name?: string }>;
      Hours?: { text?: string };
      Rating?: { score?: number; ratings?: number };
    };
  };
  geometry?: { coordinates?: [number, number] };
};

async function search(text: string, city: string): Promise<YResult[]> {
  const url = new URL('https://search-maps.yandex.ru/v1/');
  url.searchParams.set('apikey', API_KEY!);
  url.searchParams.set('text', `${text} ${city}`);
  url.searchParams.set('type', 'biz');
  url.searchParams.set('lang', 'ru_RU');
  url.searchParams.set('results', String(RESULTS_PER_QUERY));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.warn(`  HTTP ${res.status}: ${txt.slice(0, 200)}`);
    return [];
  }
  const data: any = await res.json();
  return data.features || [];
}

function csvEscape(s: any): string {
  if (s == null) return '';
  const str = String(s).replace(/"/g, '""');
  return /[",\n;]/.test(str) ? `"${str}"` : str;
}

(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const rows: string[] = [
    [
      'Дата_парсинга',
      'Сегмент',
      'Город',
      'Название',
      'Телефон',
      'Адрес',
      'Сайт',
      'Категория',
      'Рейтинг_Яндекс',
      'Отзывов',
      'Часы_работы',
      'Yandex_URL',
      'Координаты',
      'Статус',
      'Дата_звонка',
      'Ответ',
      'Заметки',
    ]
      .map(csvEscape)
      .join(','),
  ];
  const seen = new Set<string>();
  let totalFound = 0;

  for (const seg of SEGMENTS) {
    console.log(`\n=== Сегмент: ${seg.name} ===`);
    for (const q of seg.queries) {
      process.stdout.write(`  ${q}... `);
      const items = await search(q, CITY);
      console.log(`${items.length} найдено`);

      for (const f of items) {
        const meta = f.properties?.CompanyMetaData || {};
        const name = (meta.name || f.properties?.name || '').trim();
        const phones = (meta.Phones || [])
          .map((p) => p.formatted || '')
          .filter(Boolean)
          .join('; ');
        const addr = (meta.address || '').trim();

        // dedupe по name + первый телефон
        const firstPhone = phones.split(';')[0]?.trim() || '';
        const key = `${name}|${firstPhone}`;
        if (seen.has(key) || !name) continue;
        seen.add(key);

        const site = meta.url || '';
        const cat = (meta.Categories || []).map((c) => c.name).filter(Boolean).join('; ');
        const rating = meta.Rating?.score ?? '';
        const ratings = meta.Rating?.ratings ?? '';
        const hours = meta.Hours?.text || '';
        const coords = f.geometry?.coordinates ? f.geometry.coordinates.join(', ') : '';
        const yurl = `https://yandex.ru/maps/?text=${encodeURIComponent(name + ' ' + CITY)}`;

        rows.push(
          [
            today,
            seg.name,
            CITY,
            name,
            phones || '(нет в Яндексе)',
            addr,
            site,
            cat,
            rating,
            ratings,
            hours,
            yurl,
            coords,
            'не звонил',
            '',
            '',
            '',
          ]
            .map(csvEscape)
            .join(',')
        );
        totalFound++;
      }
      // антифлуд
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  const out = '/tmp/leads.csv';
  fs.writeFileSync(out, rows.join('\n'), 'utf8');
  console.log(`\nГотово: ${totalFound} уникальных лидов → ${out}`);
  console.log(`Импорт в Google Sheets: File → Import → Upload → ${out}`);
})();
