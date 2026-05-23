// Парсер локальных бизнесов через 2GIS Catalog API.
// Docs: https://docs.2gis.com/ru/api/search/places/reference/items
//
// Запуск:
//   TWOGIS_API_KEY=xxx npx tsx scripts/parseLeads2gis.ts "Ростов-на-Дону"
//
// Output: /tmp/leads.csv
import { config } from 'dotenv';
config({ override: true });
import fs from 'fs';

const API_KEY = process.env.TWOGIS_API_KEY;
const CITY = process.argv[2] || 'Ростов-на-Дону';
const PAGE_SIZE = 10; // лимит демо-ключа
const MAX_PAGES = 25; // 10×25 = 250 на запрос

if (!API_KEY) {
  console.error('TWOGIS_API_KEY не задан');
  process.exit(1);
}

const SEGMENTS = [
  {
    name: 'СТО',
    queries: ['шиномонтаж', 'автосервис', 'СТО', 'автомастерская', 'кузовной ремонт'],
  },
  {
    name: 'Барбершоп',
    queries: ['барбершоп', 'мужская парикмахерская'],
  },
];

const BASE = 'https://catalog.api.2gis.com/3.0/items';
// Минимальный набор для демо-ключа (расширенные поля типа reviews/schedule могут требовать платный тариф)
const FIELDS = [
  'items.point',
  'items.address',
  'items.contact_groups',
  'items.rubrics',
].join(',');

async function searchPage(query: string, city: string, page: number): Promise<{ items: any[]; total: number }> {
  const url = new URL(BASE);
  url.searchParams.set('q', `${query} ${city}`);
  url.searchParams.set('fields', FIELDS);
  url.searchParams.set('page_size', String(PAGE_SIZE));
  url.searchParams.set('page', String(page));
  url.searchParams.set('key', API_KEY!);
  url.searchParams.set('locale', 'ru_RU');

  const res = await fetch(url.toString());
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = null; }
  if (!res.ok || data?.meta?.code >= 400) {
    console.log(`\n    [DEBUG ${res.status}] ${text.slice(0, 250)}`);
    return { items: [], total: 0 };
  }
  const items = data?.result?.items || [];
  const total = data?.result?.total || 0;
  return { items, total };
}

function csvEscape(s: any): string {
  if (s == null) return '';
  const str = String(s).replace(/"/g, '""');
  return /[",\n;]/.test(str) ? `"${str}"` : str;
}

function extractPhones(item: any): string {
  const groups = item.contact_groups || [];
  const phones: string[] = [];
  for (const g of groups) {
    for (const c of g.contacts || []) {
      if (c.type === 'phone') phones.push(c.text || c.value || '');
    }
  }
  return phones.filter(Boolean).join('; ');
}

function extractSite(item: any): string {
  const groups = item.contact_groups || [];
  for (const g of groups) {
    for (const c of g.contacts || []) {
      if (c.type === 'website') return c.url || c.text || c.value || '';
    }
  }
  return '';
}

function extractHours(item: any): string {
  const s = item.schedule;
  if (!s) return '';
  if (s.is_24x7) return 'круглосуточно';
  return Object.entries(s)
    .filter(([k]) => /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/.test(k))
    .map(([day, val]: [string, any]) => {
      const w = val?.working_hours?.[0];
      return `${day}: ${w ? `${w.from}-${w.to}` : 'вых'}`;
    })
    .join('; ');
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
      'Рейтинг_2GIS',
      'Отзывов',
      'Часы_работы',
      '2GIS_URL',
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
  let total = 0;

  for (const seg of SEGMENTS) {
    console.log(`\n=== ${seg.name} ===`);
    for (const q of seg.queries) {
      process.stdout.write(`  ${q}: `);
      let segCount = 0;
      for (let page = 1; page <= MAX_PAGES; page++) {
        let result;
        try {
          result = await searchPage(q, CITY, page);
        } catch (e: any) {
          console.log(`(ошибка стр.${page}: ${e.message.slice(0, 80)})`);
          break;
        }
        if (!result.items.length) break;

        for (const item of result.items) {
          const name = (item.name || '').trim();
          const phones = extractPhones(item);
          const firstPhone = phones.split(';')[0]?.trim() || '';
          const key = `${name}|${firstPhone}`;
          if (seen.has(key) || !name) continue;
          seen.add(key);

          const addr = item.address_name || item.address?.name || '';
          const cat = (item.rubrics || []).map((r: any) => r.name).filter(Boolean).join('; ');
          const rating = item.reviews?.general_rating ?? '';
          const reviewsCount = item.reviews?.general_review_count ?? '';
          const hours = extractHours(item);
          const site = extractSite(item);
          const coords = item.point ? `${item.point.lat}, ${item.point.lon}` : '';
          const url = `https://2gis.ru/firm/${item.id}`;

          rows.push(
            [
              today,
              seg.name,
              CITY,
              name,
              phones || '(нет в 2ГИС)',
              addr,
              site,
              cat,
              rating,
              reviewsCount,
              hours,
              url,
              coords,
              'не звонил',
              '',
              '',
              '',
            ]
              .map(csvEscape)
              .join(',')
          );
          segCount++;
          total++;
        }

        if (result.items.length < PAGE_SIZE) break;
        await new Promise((r) => setTimeout(r, 300));
      }
      console.log(`+${segCount} новых`);
    }
  }

  const out = '/tmp/leads.csv';
  fs.writeFileSync(out, rows.join('\n'), 'utf8');
  console.log(`\n✅ Готово: ${total} уникальных лидов → ${out}`);
})();
