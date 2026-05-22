// One-off: миграция данных из Salon.settings (Json) в новые таблицы Service/Master/WorkingHours/Faq.
// Запуск: tsx scripts/migrateSettingsToTables.ts
import { config } from 'dotenv';
config({ override: true });
import prisma from '../src/db/prisma';

const WEEKDAY_RU: Record<string, number> = {
  вс: 0, sun: 0,
  пн: 1, mon: 1,
  вт: 2, tue: 2,
  ср: 3, wed: 3,
  чт: 4, thu: 4,
  пт: 5, fri: 5,
  сб: 6, sat: 6,
};

function parseTimeToMin(t?: string): number | null {
  if (!t) return null;
  const m = t.match(/^(\d{1,2}):?(\d{2})?$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2] || 0);
}

async function main() {
  const salons = await prisma.salon.findMany();
  for (const salon of salons) {
    const s: any = salon.settings || {};
    console.log(`\n[salon ${salon.id}] ${salon.name}`);

    // Services
    if (Array.isArray(s.priceList) && s.priceList.length) {
      const existing = await prisma.service.count({ where: { salonId: salon.id } });
      if (existing > 0) {
        console.log(`  services: skip (${existing} уже есть)`);
      } else {
        for (const p of s.priceList) {
          await prisma.service.create({
            data: {
              salonId: salon.id,
              name: String(p.service || p.name || 'Услуга'),
              price: Number(p.price) || 0,
              durationMin: p.duration ? Number(p.duration) : null,
            },
          });
        }
        console.log(`  services: создано ${s.priceList.length}`);
      }
    }

    // Masters
    const createdMasters = new Map<string, string>(); // name -> id
    if (Array.isArray(s.masters) && s.masters.length) {
      const existing = await prisma.master.count({ where: { salonId: salon.id } });
      if (existing > 0) {
        console.log(`  masters: skip (${existing} уже есть)`);
        const all = await prisma.master.findMany({ where: { salonId: salon.id } });
        for (const m of all) createdMasters.set(m.name, m.id);
      } else {
        for (const m of s.masters) {
          const master = await prisma.master.create({
            data: { salonId: salon.id, name: String(m.name || 'Мастер') },
          });
          createdMasters.set(master.name, master.id);
          // Привязка к услугам
          if (Array.isArray(m.services) && m.services.length) {
            const services = await prisma.service.findMany({
              where: { salonId: salon.id, name: { in: m.services } },
            });
            for (const svc of services) {
              await prisma.masterService.create({
                data: { masterId: master.id, serviceId: svc.id },
              });
            }
          }
        }
        console.log(`  masters: создано ${s.masters.length}`);
      }
    }

    // Working hours (общее расписание салона)
    if (s.schedule && (s.schedule.from || s.schedule.to)) {
      const existing = await prisma.workingHours.count({
        where: { salonId: salon.id, masterId: null },
      });
      if (existing > 0) {
        console.log(`  working hours: skip (${existing} уже есть)`);
      } else {
        const fromMin = parseTimeToMin(s.schedule.from) ?? 9 * 60;
        const toMin = parseTimeToMin(s.schedule.to) ?? 21 * 60;
        const days: number[] = [];
        if (Array.isArray(s.schedule.days) && s.schedule.days.length) {
          for (const d of s.schedule.days) {
            const w = WEEKDAY_RU[String(d).toLowerCase().slice(0, 3)] ?? WEEKDAY_RU[String(d).toLowerCase().slice(0, 2)];
            if (w !== undefined) days.push(w);
          }
        }
        const finalDays = days.length ? days : [1, 2, 3, 4, 5, 6]; // пн-сб дефолт
        for (const weekday of finalDays) {
          await prisma.workingHours.create({
            data: { salonId: salon.id, weekday, fromMin, toMin },
          });
        }
        console.log(`  working hours: создано ${finalDays.length} дней (${fromMin}–${toMin} мин)`);
      }
    }

    // FAQ
    if (Array.isArray(s.faq) && s.faq.length) {
      const existing = await prisma.faq.count({ where: { salonId: salon.id } });
      if (existing > 0) {
        console.log(`  faq: skip (${existing} уже есть)`);
      } else {
        for (let i = 0; i < s.faq.length; i++) {
          const f = s.faq[i];
          await prisma.faq.create({
            data: {
              salonId: salon.id,
              question: String(f.question || ''),
              answer: String(f.answer || ''),
              order: i,
            },
          });
        }
        console.log(`  faq: создано ${s.faq.length}`);
      }
    }
  }
  console.log('\n[done]');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
