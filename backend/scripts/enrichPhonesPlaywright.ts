// Достаём телефоны со страниц 2gis.ru через headless-браузер.
// Запуск: npx tsx scripts/enrichPhonesPlaywright.ts /tmp/leads.csv
import fs from 'fs';
import { chromium, Browser } from 'playwright';

const INPUT = process.argv[2] || '/tmp/leads.csv';
const OUTPUT = INPUT.replace('.csv', '.enriched.csv');
const CONCURRENCY = 3;

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

// Валидные российские коды
function isValidRuPhone(digits: string): boolean {
  if (digits.length !== 11 || !digits.startsWith('7')) return false;
  const code = digits.slice(1, 4);
  // Мобильные: 9XX. Стационарные: 3XX, 4XX, 8XX (но не любые).
  if (/^9\d{2}$/.test(code)) return true;
  // Часто встречающиеся стационарные коды городов
  if (/^(3|4|8)\d{2}$/.test(code)) return true;
  return false;
}

async function fetchPhones(browser: Browser, firmId: string): Promise<string[]> {
  const page = await browser.newPage();
  try {
    await page.goto(`https://2gis.ru/firm/${firmId}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    // Ждём появления любого телефонного содержимого. Иногда кнопка "Показать телефон" — попробуем кликнуть.
    try {
      await page.waitForSelector('a[href^="tel:"], button:has-text("Показать"), [class*="phone"]', { timeout: 8000 });
    } catch {}
    // Клик по "Показать телефон" если есть
    const showBtn = page.locator('button:has-text("Показать")').first();
    if (await showBtn.count()) {
      try { await showBtn.click({ timeout: 2000 }); await page.waitForTimeout(800); } catch {}
    }
    // Достаём из tel: ссылок
    const tels = await page.$$eval('a[href^="tel:"]', (els) => els.map((e) => e.getAttribute('href') || ''));
    const phones = new Set<string>();
    for (const t of tels) {
      const digits = t.replace(/\D/g, '');
      let normalized = digits;
      if (normalized.length === 11 && normalized.startsWith('8')) normalized = '7' + normalized.slice(1);
      if (isValidRuPhone(normalized)) {
        const f = '+7 ' + normalized.slice(1, 4) + ' ' + normalized.slice(4, 7) + '-' + normalized.slice(7, 9) + '-' + normalized.slice(9);
        phones.add(f);
      }
    }
    return Array.from(phones).slice(0, 3);
  } catch (e) {
    return [];
  } finally {
    await page.close().catch(() => {});
  }
}

(async () => {
  const lines = fs.readFileSync(INPUT, 'utf8').split('\n').filter(Boolean);
  const header = parseCsvLine(lines[0]);
  const phoneIdx = header.indexOf('Телефон');
  const urlIdx = header.indexOf('2GIS_URL');
  const nameIdx = header.indexOf('Название');

  const browser = await chromium.launch({ headless: true });
  console.log(`Headless Chrome запущен, обрабатываем ${lines.length - 1} лидов (concurrency=${CONCURRENCY})...`);

  type Task = { idx: number; row: string[]; firmId: string };
  const tasks: Task[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const firmId = row[urlIdx]?.match(/firm\/(\d+)/)?.[1];
    if (firmId) tasks.push({ idx: i, row, firmId });
  }

  let processed = 0;
  let enriched = 0;
  const results = new Map<number, string[]>();

  async function worker() {
    while (tasks.length) {
      const t = tasks.shift();
      if (!t) break;
      processed++;
      const phones = await fetchPhones(browser, t.firmId);
      if (phones.length) {
        t.row[phoneIdx] = phones.join('; ');
        enriched++;
        console.log(`  [${processed}] ✓ ${t.row[nameIdx].slice(0, 40)} → ${phones[0]}`);
      } else {
        console.log(`  [${processed}] ✗ ${t.row[nameIdx].slice(0, 40)}`);
      }
      results.set(t.idx, t.row);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  await browser.close();

  // Собираем выход в порядке исходного файла
  const out: string[] = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    const updated = results.get(i);
    if (updated) out.push(updated.map(csvEscape).join(','));
    else out.push(lines[i]);
  }

  fs.writeFileSync(OUTPUT, out.join('\n'), 'utf8');
  console.log(`\n✅ Обогащено ${enriched}/${lines.length - 1} → ${OUTPUT}`);
})();
