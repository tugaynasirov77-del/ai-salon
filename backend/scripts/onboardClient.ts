// Подключение клиента «под ключ» за одну команду.
// Использование:
//   npx tsx scripts/onboardClient.ts ./configs/client-name.json
//   npx tsx scripts/onboardClient.ts ./configs/client-name.json --dry-run
//
// JSON-схема — см. configs/_template.json
import { config as loadEnv } from 'dotenv';
loadEnv({ override: true });
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import prisma from '../src/db/prisma';
import { setWebhookForSalon as setTelegramWebhook } from '../src/channels/telegram';
import {
  getBotInfo as getMaxBotInfo,
  setWebhookForSalon as setMaxWebhook,
} from '../src/channels/max';
import {
  getSelfInfo as getAvitoSelfInfo,
  subscribeWebhook as subscribeAvitoWebhook,
} from '../src/channels/avito';

type Config = {
  owner: { email: string; password: string; name: string; phone: string };
  salon: { name: string; niche: string; address?: string; city?: string; plan?: string };
  ownerChatId?: string;
  telegramBotToken?: string;
  maxBotToken?: string;
  avito?: { clientId: string; clientSecret: string; userId: string };
  services?: Array<{ name: string; price: number; durationMin?: number; masters?: string[] }>;
  masters?: Array<{ name: string; phone?: string; services?: string[] }>;
  workingHours?: {
    default?: Array<{ weekday: number; fromMin: number; toMin: number }>;
    byMaster?: Record<string, Array<{ weekday: number; fromMin: number; toMin: number }>>;
  };
  faqs?: Array<{ question: string; answer: string }>;
};

const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

function step(msg: string): void {
  console.log('\n' + cyan('▶ ' + msg));
}
function ok(msg: string): void {
  console.log('  ' + green('✓') + ' ' + msg);
}
function warn(msg: string): void {
  console.log('  ' + yellow('!') + ' ' + msg);
}
function fail(msg: string): void {
  console.log('  ' + red('✗') + ' ' + msg);
}

async function main() {
  const configPath = process.argv[2];
  const dryRun = process.argv.includes('--dry-run');

  if (!configPath) {
    console.error('Usage: onboardClient.ts <config.json> [--dry-run]');
    process.exit(1);
  }

  const cfg: Config = JSON.parse(fs.readFileSync(path.resolve(configPath), 'utf8'));

  console.log(cyan('\n═══════════════════════════════════════════════════'));
  console.log(cyan(' Liva AI — Onboarding клиента «Под ключ»'));
  console.log(cyan('═══════════════════════════════════════════════════'));
  console.log(`  Салон: ${cfg.salon.name}`);
  console.log(`  Ниша: ${cfg.salon.niche}`);
  console.log(`  Владелец: ${cfg.owner.name} <${cfg.owner.email}>`);
  if (dryRun) console.log(yellow('  Режим: DRY-RUN (ничего не сохраняем)'));

  // ───── 1. Регистрация владельца + создание салона ─────
  step('Шаг 1/7 · Регистрация владельца и создание салона');
  const emailLower = cfg.owner.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: emailLower } });
  if (existing) {
    fail(`Пользователь ${emailLower} уже существует (salonId=${existing.salonId})`);
    process.exit(1);
  }

  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    fail('BASE_URL не задан в .env');
    process.exit(1);
  }

  let salonId = 'dry-run-salon';
  let userId = 'dry-run-user';

  if (!dryRun) {
    const passwordHash = await bcrypt.hash(cfg.owner.password, 10);
    const result = await prisma.$transaction(async (tx) => {
      const salon = await tx.salon.create({
        data: {
          name: cfg.salon.name,
          ownerName: cfg.owner.name,
          phone: cfg.owner.phone,
          niche: cfg.salon.niche,
          address: cfg.salon.address || null,
          plan: cfg.salon.plan || 'starter',
          settings: {
            ...(cfg.salon.city ? { city: cfg.salon.city } : {}),
            ...(cfg.ownerChatId ? { ownerChatId: cfg.ownerChatId } : {}),
          },
        },
      });
      const user = await tx.user.create({
        data: {
          email: emailLower,
          passwordHash,
          name: cfg.owner.name,
          role: 'owner',
          salonId: salon.id,
        },
      });
      return { salon, user };
    });
    salonId = result.salon.id;
    userId = result.user.id;
  }

  ok(`Салон создан: id=${salonId}`);
  ok(`Владелец: ${emailLower}`);

  // ───── 2. Услуги ─────
  step(`Шаг 2/7 · Услуги (${cfg.services?.length || 0})`);
  const serviceNameToId = new Map<string, string>();
  if (cfg.services?.length && !dryRun) {
    for (const s of cfg.services) {
      const created = await prisma.service.create({
        data: { salonId, name: s.name, price: s.price, durationMin: s.durationMin ?? null },
      });
      serviceNameToId.set(s.name, created.id);
    }
    ok(`Создано: ${cfg.services.length}`);
  } else if (cfg.services?.length) {
    ok(`DRY: было бы создано ${cfg.services.length}`);
  } else {
    warn('Услуг нет в конфиге');
  }

  // ───── 3. Мастера ─────
  step(`Шаг 3/7 · Мастера (${cfg.masters?.length || 0})`);
  const masterNameToId = new Map<string, string>();
  if (cfg.masters?.length && !dryRun) {
    for (const m of cfg.masters) {
      const master = await prisma.master.create({
        data: { salonId, name: m.name, phone: m.phone ?? null },
      });
      masterNameToId.set(m.name, master.id);
      if (m.services?.length) {
        const svcIds = m.services.map((n) => serviceNameToId.get(n)).filter(Boolean) as string[];
        if (svcIds.length) {
          await prisma.masterService.createMany({
            data: svcIds.map((sid) => ({ masterId: master.id, serviceId: sid })),
            skipDuplicates: true,
          });
        }
      }
    }
    ok(`Создано: ${cfg.masters.length}`);
  } else if (cfg.masters?.length) {
    ok(`DRY: было бы создано ${cfg.masters.length}`);
  } else {
    warn('Мастеров нет в конфиге');
  }

  // ───── 4. Расписание ─────
  step('Шаг 4/7 · Расписание');
  if (cfg.workingHours?.default?.length && !dryRun) {
    await prisma.workingHours.createMany({
      data: cfg.workingHours.default.map((h) => ({
        salonId,
        masterId: null,
        weekday: h.weekday,
        fromMin: h.fromMin,
        toMin: h.toMin,
      })),
    });
    ok(`Общее расписание: ${cfg.workingHours.default.length} дней`);
  }
  if (cfg.workingHours?.byMaster && !dryRun) {
    let cnt = 0;
    for (const [masterName, hours] of Object.entries(cfg.workingHours.byMaster)) {
      const masterId = masterNameToId.get(masterName);
      if (!masterId) {
        warn(`Расписание для "${masterName}" пропущено — нет такого мастера`);
        continue;
      }
      await prisma.workingHours.createMany({
        data: hours.map((h) => ({ salonId, masterId, weekday: h.weekday, fromMin: h.fromMin, toMin: h.toMin })),
      });
      cnt += hours.length;
    }
    if (cnt) ok(`Индивидуальные графики мастеров: ${cnt} интервалов`);
  }
  if (!cfg.workingHours) warn('Расписания нет в конфиге');

  // ───── 5. FAQ ─────
  step(`Шаг 5/7 · FAQ (${cfg.faqs?.length || 0})`);
  if (cfg.faqs?.length && !dryRun) {
    await prisma.faq.createMany({
      data: cfg.faqs.map((f, i) => ({ salonId, question: f.question, answer: f.answer, order: i })),
    });
    ok(`Создано: ${cfg.faqs.length}`);
  } else if (cfg.faqs?.length) {
    ok(`DRY: было бы создано ${cfg.faqs.length}`);
  }

  // ───── 6. Подключение каналов ─────
  step('Шаг 6/7 · Каналы');

  // Telegram
  if (cfg.telegramBotToken) {
    if (!dryRun) {
      try {
        await prisma.salon.update({ where: { id: salonId }, data: { telegramBotToken: cfg.telegramBotToken } });
        await setTelegramWebhook(salonId, cfg.telegramBotToken, baseUrl);
        ok(`Telegram-бот подключён → ${baseUrl}/webhook/telegram/${salonId}`);
      } catch (e: any) {
        fail(`Telegram: ${e.message}`);
      }
    } else ok('DRY: Telegram-бот был бы подключён');
  } else {
    dim('  · Telegram-бот пропущен (нет токена в конфиге)');
  }

  // Max
  if (cfg.maxBotToken) {
    if (!dryRun) {
      try {
        const info = await getMaxBotInfo(cfg.maxBotToken);
        await prisma.salon.update({ where: { id: salonId }, data: { maxBotToken: cfg.maxBotToken } });
        await setMaxWebhook(salonId, cfg.maxBotToken, baseUrl);
        ok(`Max-бот подключён: @${info.username || info.name}`);
      } catch (e: any) {
        fail(`Max: ${e.message}`);
      }
    } else ok('DRY: Max-бот был бы подключён');
  }

  // Avito
  if (cfg.avito) {
    if (!dryRun) {
      try {
        await getAvitoSelfInfo(cfg.avito);
        await prisma.salon.update({
          where: { id: salonId },
          data: {
            avitoClientId: cfg.avito.clientId,
            avitoClientSecret: cfg.avito.clientSecret,
            avitoUserId: cfg.avito.userId,
          },
        });
        await subscribeAvitoWebhook(cfg.avito, `${baseUrl}/webhook/avito/${salonId}`);
        ok('Avito подключён');
      } catch (e: any) {
        fail(`Avito: ${e.message}`);
      }
    } else ok('DRY: Avito был бы подключён');
  }

  // ───── 7. Welcome-message владельцу ─────
  step('Шаг 7/7 · Welcome-сообщение владельцу');
  if (cfg.ownerChatId && cfg.telegramBotToken && !dryRun) {
    try {
      const widgetSnippet = `<script src="${baseUrl}/widget.js?salon=${salonId}" async></script>`;
      const text =
        `🎉 *Liva AI готов к работе!*\n\n` +
        `Салон: *${cfg.salon.name}*\n` +
        `Услуг: ${cfg.services?.length || 0}\n` +
        `Мастеров: ${cfg.masters?.length || 0}\n\n` +
        `🤖 Ваш Telegram-бот уже принимает клиентов — напишите ему любое сообщение, чтобы проверить.\n\n` +
        `🌐 Виджет на сайт (одна строка):\n\`${widgetSnippet}\`\n\n` +
        `📱 Админка: https://ailiva.ru/login (логин: \`${emailLower}\`)\n\n` +
        `Если что-то не так — пишите, на связи.`;
      const tgUrl = `https://api.telegram.org/bot${cfg.telegramBotToken}/sendMessage`;
      const res = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: cfg.ownerChatId, text, parse_mode: 'Markdown' }),
      });
      const data: any = await res.json();
      if (data.ok) ok(`Welcome отправлен в Telegram (chat_id=${cfg.ownerChatId})`);
      else fail(`Telegram: ${data.description}`);
    } catch (e: any) {
      fail(`Welcome: ${e.message}`);
    }
  } else if (!cfg.ownerChatId) {
    warn('ownerChatId не задан — пропускаем welcome');
  } else if (!cfg.telegramBotToken) {
    warn('telegramBotToken не задан — некому слать welcome');
  }

  // ───── Финальный отчёт ─────
  console.log(cyan('\n═══════════════════════════════════════════════════'));
  console.log(green(' ✅ Готово'));
  console.log(cyan('═══════════════════════════════════════════════════'));
  console.log(`  Salon ID:  ${cyan(salonId)}`);
  console.log(`  Логин:     ${cyan(emailLower)}`);
  console.log(`  Пароль:    ${cyan(cfg.owner.password)}`);
  console.log(`  Админка:   https://ailiva.ru/login`);
  console.log(`  Webhook:   ${baseUrl}/webhook/telegram/${salonId}`);
  console.log(`  Виджет:    <script src="${baseUrl}/widget.js?salon=${salonId}" async></script>`);
  console.log();
}

main()
  .catch((e) => {
    console.error(red('\n[onboard] фатальная ошибка:'), e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    // Принудительный выход — фоновые модули (BullMQ Redis pool) могут держать event loop
    setTimeout(() => process.exit(process.exitCode || 0), 500).unref();
  });
