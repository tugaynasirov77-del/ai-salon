// Достаём телефоны с публичных страниц 2gis.ru/firm/ID (демо-ключ их не отдаёт).
// Запуск: npx tsx scripts/enrichPhones2gis.ts /tmp/leads.csv
import fs from 'fs';

const INPUT = process.argv[2] || '/tmp/leads.csv';
const OUTPUT = INPUT.replace('.csv', '.enriched.csv');

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

async function fetchFirmPhones(firmId: string): Promise<string[]> {
  try {
    const url = `https://2gis.ru/firm/${firmId}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9',
      },
      redirect: 'follow',
    });
    const html = await res.text();
    // Ищем телефоны в формате +7XXXXXXXXXX или 8XXXXXXXXXX
    const phones = new Set<string>();
    const phoneRe = /(?:\+7|8)[\s\-()]*\d{3}[\s\-()]*\d{3}[\s\-()]*\d{2}[\s\-()]*\d{2}/g;
    let m;
    while ((m = phoneRe.exec(html)) !== null) {
      const normalized = m[0].replace(/\D/g, '');
      if (normalized.length === 11) {
        const formatted = '+7 ' + normalized.slice(1, 4) + ' ' + normalized.slice(4, 7) + '-' + normalized.slice(7, 9) + '-' + normalized.slice(9);
        phones.add(formatted);
      }
    }
    return Array.from(phones).slice(0, 3); // максимум 3 номера
  } catch (e: any) {
    return [];
  }
}

(async () => {
  const lines = fs.readFileSync(INPUT, 'utf8').split('\n').filter(Boolean);
  const header = parseCsvLine(lines[0]);
  const phoneIdx = header.indexOf('Телефон');
  const urlIdx = header.indexOf('2GIS_URL');
  const nameIdx = header.indexOf('Название');

  console.log(`Обработка ${lines.length - 1} лидов...`);
  const out: string[] = [lines[0]];
  let enriched = 0;
  let failed = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const name = row[nameIdx];
    const url = row[urlIdx];
    const currentPhone = row[phoneIdx];

    if (currentPhone && currentPhone !== '(нет в 2ГИС)' && /\d/.test(currentPhone)) {
      out.push(lines[i]);
      continue;
    }

    const firmId = url?.match(/firm\/(\d+)/)?.[1];
    if (!firmId) {
      out.push(lines[i]);
      failed++;
      continue;
    }

    process.stdout.write(`  [${i}/${lines.length - 1}] ${name.slice(0, 40)}... `);
    const phones = await fetchFirmPhones(firmId);
    if (phones.length) {
      row[phoneIdx] = phones.join('; ');
      enriched++;
      console.log(`✓ ${phones[0]}`);
    } else {
      failed++;
      console.log(`✗`);
    }
    out.push(row.map(csvEscape).join(','));
    await new Promise((r) => setTimeout(r, 600)); // антибан
  }

  fs.writeFileSync(OUTPUT, out.join('\n'), 'utf8');
  console.log(`\n✅ Обогащено ${enriched}, не нашли ${failed} → ${OUTPUT}`);
})();
