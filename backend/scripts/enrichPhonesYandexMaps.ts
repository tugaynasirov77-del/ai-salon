// Достаём телефоны через публичный поиск yandex.ru/maps.
// Запуск: npx tsx scripts/enrichPhonesYandexMaps.ts /tmp/leads.csv
import fs from 'fs';
import { chromium, Browser } from 'playwright';

const INPUT = process.argv[2] || '/tmp/leads.csv';
const OUTPUT = INPUT.replace('.csv', '.enriched.csv');
const CONCURRENCY = 2;

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

function csvEscape(s: any): string {
  if (s == null) return '';
  const str = String(s).replace(/"/g, '""');
  return /[",\n;]/.test(str) ? `"${str}"` : str;
}

function isValidRuPhone(digits: string): boolean {
  if (digits.length !== 11 || !digits.startsWith('7')) return false;
  const code = digits.slice(1, 4);
  return /^[3489]\d{2}$/.test(code);
}

function formatPhone(digits: string): string {
  return '+7 ' + digits.slice(1, 4) + ' ' + digits.slice(4, 7) + '-' + digits.slice(7, 9) + '-' + digits.slice(9);
}

async function findPhonesViaYandex(browser: Browser, name: string, city: string): Promise<string[]> {
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'ru-RU',
    viewport: { width: 1280, height: 800 },
  });
  const page = await ctx.newPage();
  const phones = new Set<string>();
  try {
    const query = encodeURIComponent(`${name} ${city}`);
    await page.goto(`https://yandex.ru/maps/?text=${query}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2500);
    // Кликнуть на первую карточку результата, если есть список
    const firstCard = page.locator('.search-business-snippet-view__title, .search-snippet-view').first();
    if (await firstCard.count()) {
      try { await firstCard.click({ timeout: 2000 }); await page.waitForTimeout(1500); } catch {}
    }
    // Иногда нужно раскрыть "Показать телефон"
    const showBtn = page.locator('text=/Показать телефон/i').first();
    if (await showBtn.count()) {
      try { await showBtn.click({ timeout: 1500 }); await page.waitForTimeout(800); } catch {}
    }
    // tel: ссылки в сайдбаре
    const tels = await page.$$eval('a[href^="tel:"]', (els) => els.map((e) => e.getAttribute('href') || ''));
    for (const t of tels) {
      let digits = t.replace(/\D/g, '');
      if (digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1);
      if (isValidRuPhone(digits)) phones.add(formatPhone(digits));
    }
    // Доп.: ищем телефоны прямо в тексте панели
    if (!phones.size) {
      const text = await page.evaluate(() => document.body.innerText);
      const re = /(?:\+7|8)[\s\-()]*(\d{3})[\s\-()]*(\d{3})[\s\-()]*(\d{2})[\s\-()]*(\d{2})/g;
      let m;
      while ((m = re.exec(text)) !== null) {
        const digits = '7' + m[1] + m[2] + m[3] + m[4];
        if (isValidRuPhone(digits)) phones.add(formatPhone(digits));
      }
    }
  } catch (e) {
    // ignore
  } finally {
    await page.close().catch(() => {});
    await ctx.close().catch(() => {});
  }
  return Array.from(phones).slice(0, 3);
}

(async () => {
  const lines = fs.readFileSync(INPUT, 'utf8').split('\n').filter(Boolean);
  const header = parseCsvLine(lines[0]);
  const phoneIdx = header.indexOf('Телефон');
  const nameIdx = header.indexOf('Название');
  const cityIdx = header.indexOf('Город');

  const browser = await chromium.launch({ headless: true });
  console.log(`Запущен Chromium. Обогащаем ${lines.length - 1} лидов через Я.Карты (concurrency=${CONCURRENCY})...`);

  type Task = { idx: number; row: string[]; name: string; city: string };
  const queue: Task[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const cur = row[phoneIdx];
    if (cur && cur !== '(нет в 2ГИС)' && /\d{5}/.test(cur)) continue;
    queue.push({ idx: i, row, name: row[nameIdx], city: row[cityIdx] || 'Ростов-на-Дону' });
  }

  let done = 0;
  const enriched = new Map<number, string[]>();

  async function worker() {
    while (queue.length) {
      const t = queue.shift();
      if (!t) break;
      const phones = await findPhonesViaYandex(browser, t.name, t.city);
      done++;
      if (phones.length) {
        t.row[phoneIdx] = phones.join('; ');
        enriched.set(t.idx, t.row);
        console.log(`  [${done}] ✓ ${t.name.slice(0, 40)} → ${phones[0]}`);
      } else {
        console.log(`  [${done}] ✗ ${t.name.slice(0, 40)}`);
      }
      await new Promise((r) => setTimeout(r, 1500)); // антифлуд
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  await browser.close();

  const out: string[] = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    const updated = enriched.get(i);
    if (updated) out.push(updated.map(csvEscape).join(','));
    else out.push(lines[i]);
  }

  fs.writeFileSync(OUTPUT, out.join('\n'), 'utf8');
  console.log(`\n✅ Обогащено ${enriched.size}/${lines.length - 1} → ${OUTPUT}`);
})();
