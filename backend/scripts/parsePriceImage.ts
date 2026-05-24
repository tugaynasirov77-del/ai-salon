// Vision-парсер прайса: фото → JSON услуг.
// Использует Claude Haiku 4.5 vision через OpenRouter.
//
// Использование:
//   npx tsx scripts/parsePriceImage.ts ./price.jpg
//   npx tsx scripts/parsePriceImage.ts ./price.jpg --niche=auto_service
//   npx tsx scripts/parsePriceImage.ts https://example.com/price.png
//
// Output (stdout): JSON массив для вставки в config.services
import { config as loadEnv } from 'dotenv';
loadEnv({ override: true });
import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.LLM_MODEL || 'anthropic/claude-haiku-4.5';
const LLM_BASE_URL = process.env.LLM_BASE_URL;
const KEY = process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || '';

if (!KEY) {
  console.error('LLM_API_KEY / ANTHROPIC_API_KEY не задан в .env');
  process.exit(1);
}

const NICHE_HINTS: Record<string, string> = {
  auto_service: 'Это автосервис/СТО. Услуги типа шиномонтаж, замена масла, диагностика, кузовной ремонт. Длительность в минутах.',
  barbershop: 'Это барбершоп. Услуги: стрижка, борода, моделирование, детская стрижка. Длительность в минутах.',
  beauty_salon: 'Это салон красоты. Услуги: маникюр, педикюр, окрашивание, стрижка, brow, lash. Длительность в минутах.',
  fitness: 'Это фитнес-студия. Услуги: индивидуальные тренировки, групповые занятия, абонементы.',
  clinic: 'Это медицинская клиника. Услуги: приёмы специалистов, анализы, процедуры.',
};

async function imageToBase64(src: string): Promise<{ data: string; mediaType: string }> {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Не удалось загрузить ${src}: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get('content-type') || 'image/jpeg';
    return { data: buf.toString('base64'), mediaType: ct.split(';')[0] };
  }
  const abs = path.resolve(src);
  if (!fs.existsSync(abs)) throw new Error(`Файл не найден: ${abs}`);
  const buf = fs.readFileSync(abs);
  const ext = path.extname(abs).toLowerCase();
  const mediaType =
    ext === '.png' ? 'image/png' :
    ext === '.webp' ? 'image/webp' :
    ext === '.gif' ? 'image/gif' :
    'image/jpeg';
  return { data: buf.toString('base64'), mediaType };
}

async function main() {
  const src = process.argv[2];
  if (!src) {
    console.error('Usage: parsePriceImage.ts <image-path-or-url> [--niche=KEY]');
    process.exit(1);
  }
  const nicheArg = process.argv.find((a) => a.startsWith('--niche='));
  const niche = nicheArg ? nicheArg.split('=')[1] : '';
  const nicheHint = NICHE_HINTS[niche] || '';

  console.error(`[parser] загружаю ${src}...`);
  const img = await imageToBase64(src);
  console.error(`[parser] размер: ${Math.round(img.data.length * 0.75 / 1024)} КБ`);

  const opts: ConstructorParameters<typeof Anthropic>[0] = { apiKey: KEY };
  if (LLM_BASE_URL) {
    opts.baseURL = LLM_BASE_URL;
    opts.defaultHeaders = { Authorization: `Bearer ${KEY}` };
  }
  const client = new Anthropic(opts);

  const prompt =
    `На картинке — прайс-лист услуг. Извлеки все услуги в JSON-массив со строгой структурой:\n` +
    `[{"name": "точное название услуги", "price": число_в_рублях, "durationMin": длительность_в_минутах_если_указана_иначе_null}]\n\n` +
    `Правила:\n` +
    `1. Цены — только числа (без "₽", "руб.", "от", диапазонов). Если в прайсе "от 1500" — используй 1500.\n` +
    `2. Если в прайсе диапазон ("1500-2500") — возьми минимальную цену, в name припиши "(от)".\n` +
    `3. Названия — точно как в прайсе, но без избыточных деталей. Краткие и понятные.\n` +
    `4. Если длительность не указана — null, не угадывай.\n` +
    `5. Не дублируй позиции. Не выдумывай услуги которых нет на фото.\n` +
    `6. Если фото не прайс или нечитаемое — верни пустой массив [].\n` +
    (nicheHint ? `\nКонтекст: ${nicheHint}\n` : '') +
    `\nВерни ТОЛЬКО JSON-массив, без markdown, без объяснений, без текста до/после.`;

  console.error(`[parser] вызываю Claude vision (model=${MODEL})...`);
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: img.mediaType as any, data: img.data },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  const raw = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as any).text)
    .join('')
    .trim();

  // Чистим возможные markdown-обёртки на всякий случай
  const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    console.error(`[parser] не смог распарсить JSON. Сырой ответ модели:\n${raw}`);
    process.exit(1);
  }

  if (!Array.isArray(parsed)) {
    console.error('[parser] ответ не массив:', parsed);
    process.exit(1);
  }

  console.error(`[parser] извлечено услуг: ${parsed.length}`);
  console.error(
    `[parser] расход: in=${response.usage.input_tokens} out=${response.usage.output_tokens} ` +
      `cache_read=${(response.usage as any).cache_read_input_tokens || 0}`
  );

  // stdout — чистый JSON для пайпа
  console.log(JSON.stringify(parsed, null, 2));
}

main().catch((e) => {
  console.error('[parser] ошибка:', e);
  process.exit(1);
});
