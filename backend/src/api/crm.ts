// CRM CRUD: services, masters, working-hours, faqs.
// Все роуты монтируются под /api/salons/:id/...
import { Router } from 'express';
import prisma from '../db/prisma';
import { asyncHandler } from '../middleware/errors';

const router = Router({ mergeParams: true });

// ────── Services ──────
router.get(
  '/:id/services',
  asyncHandler(async (req, res) => {
    const services = await prisma.service.findMany({
      where: { salonId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: { masters: { select: { masterId: true } } },
    });
    res.json(services);
  })
);

router.post(
  '/:id/services',
  asyncHandler(async (req, res) => {
    const { name, price, durationMin, masterIds } = req.body;
    if (!name || typeof price !== 'number') {
      res.status(400).json({ error: 'name, price (число) обязательны' });
      return;
    }
    const service = await prisma.service.create({
      data: {
        salonId: req.params.id,
        name,
        price,
        durationMin: durationMin ?? null,
      },
    });
    if (Array.isArray(masterIds) && masterIds.length) {
      await prisma.masterService.createMany({
        data: masterIds.map((mid: string) => ({ masterId: mid, serviceId: service.id })),
        skipDuplicates: true,
      });
    }
    res.status(201).json(service);
  })
);

router.put(
  '/:id/services/:serviceId',
  asyncHandler(async (req, res) => {
    const { name, price, durationMin, isActive, masterIds } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (price !== undefined) data.price = price;
    if (durationMin !== undefined) data.durationMin = durationMin;
    if (isActive !== undefined) data.isActive = isActive;
    const service = await prisma.service.update({
      where: { id: req.params.serviceId },
      data,
    });
    if (Array.isArray(masterIds)) {
      await prisma.masterService.deleteMany({ where: { serviceId: service.id } });
      if (masterIds.length) {
        await prisma.masterService.createMany({
          data: masterIds.map((mid: string) => ({ masterId: mid, serviceId: service.id })),
          skipDuplicates: true,
        });
      }
    }
    res.json(service);
  })
);

router.delete(
  '/:id/services/:serviceId',
  asyncHandler(async (req, res) => {
    await prisma.service.delete({ where: { id: req.params.serviceId } });
    res.json({ ok: true });
  })
);

// ────── Masters ──────
router.get(
  '/:id/masters',
  asyncHandler(async (req, res) => {
    const masters = await prisma.master.findMany({
      where: { salonId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: { services: { select: { serviceId: true } } },
    });
    res.json(masters);
  })
);

router.post(
  '/:id/masters',
  asyncHandler(async (req, res) => {
    const { name, phone, serviceIds } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name обязателен' });
      return;
    }
    const master = await prisma.master.create({
      data: { salonId: req.params.id, name, phone: phone ?? null },
    });
    if (Array.isArray(serviceIds) && serviceIds.length) {
      await prisma.masterService.createMany({
        data: serviceIds.map((sid: string) => ({ masterId: master.id, serviceId: sid })),
        skipDuplicates: true,
      });
    }
    res.status(201).json(master);
  })
);

router.put(
  '/:id/masters/:masterId',
  asyncHandler(async (req, res) => {
    const { name, phone, isActive, serviceIds } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (isActive !== undefined) data.isActive = isActive;
    const master = await prisma.master.update({
      where: { id: req.params.masterId },
      data,
    });
    if (Array.isArray(serviceIds)) {
      await prisma.masterService.deleteMany({ where: { masterId: master.id } });
      if (serviceIds.length) {
        await prisma.masterService.createMany({
          data: serviceIds.map((sid: string) => ({ masterId: master.id, serviceId: sid })),
          skipDuplicates: true,
        });
      }
    }
    res.json(master);
  })
);

router.delete(
  '/:id/masters/:masterId',
  asyncHandler(async (req, res) => {
    await prisma.master.delete({ where: { id: req.params.masterId } });
    res.json({ ok: true });
  })
);

// ────── Working hours ──────
// masterId=null → расписание салона; иначе расписание конкретного мастера.
router.get(
  '/:id/working-hours',
  asyncHandler(async (req, res) => {
    const { masterId } = req.query as Record<string, string | undefined>;
    const where: any = { salonId: req.params.id };
    if (masterId === 'null' || masterId === '') where.masterId = null;
    else if (masterId) where.masterId = masterId;
    const hours = await prisma.workingHours.findMany({
      where,
      orderBy: [{ weekday: 'asc' }, { fromMin: 'asc' }],
    });
    res.json(hours);
  })
);

// Bulk replace: PUT принимает массив, заменяет всё расписание (для салона или мастера)
router.put(
  '/:id/working-hours',
  asyncHandler(async (req, res) => {
    const { masterId, hours } = req.body as {
      masterId?: string | null;
      hours: Array<{ weekday: number; fromMin: number; toMin: number }>;
    };
    if (!Array.isArray(hours)) {
      res.status(400).json({ error: 'hours[] обязателен' });
      return;
    }
    for (const h of hours) {
      if (typeof h.weekday !== 'number' || h.weekday < 0 || h.weekday > 6) {
        res.status(400).json({ error: 'weekday 0..6' });
        return;
      }
      if (typeof h.fromMin !== 'number' || typeof h.toMin !== 'number' || h.fromMin >= h.toMin) {
        res.status(400).json({ error: 'fromMin/toMin некорректны' });
        return;
      }
    }
    const mid = masterId ?? null;
    await prisma.$transaction([
      prisma.workingHours.deleteMany({ where: { salonId: req.params.id, masterId: mid } }),
      prisma.workingHours.createMany({
        data: hours.map((h) => ({
          salonId: req.params.id,
          masterId: mid,
          weekday: h.weekday,
          fromMin: h.fromMin,
          toMin: h.toMin,
        })),
      }),
    ]);
    const fresh = await prisma.workingHours.findMany({
      where: { salonId: req.params.id, masterId: mid },
      orderBy: [{ weekday: 'asc' }, { fromMin: 'asc' }],
    });
    res.json(fresh);
  })
);

// ────── FAQ ──────
router.get(
  '/:id/faqs',
  asyncHandler(async (req, res) => {
    const faqs = await prisma.faq.findMany({
      where: { salonId: req.params.id },
      orderBy: { order: 'asc' },
    });
    res.json(faqs);
  })
);

router.post(
  '/:id/faqs',
  asyncHandler(async (req, res) => {
    const { question, answer, order } = req.body;
    if (!question || !answer) {
      res.status(400).json({ error: 'question, answer обязательны' });
      return;
    }
    const max = await prisma.faq.aggregate({
      where: { salonId: req.params.id },
      _max: { order: true },
    });
    const faq = await prisma.faq.create({
      data: {
        salonId: req.params.id,
        question,
        answer,
        order: typeof order === 'number' ? order : (max._max.order ?? -1) + 1,
      },
    });
    res.status(201).json(faq);
  })
);

router.put(
  '/:id/faqs/:faqId',
  asyncHandler(async (req, res) => {
    const { question, answer, order } = req.body;
    const data: any = {};
    if (question !== undefined) data.question = question;
    if (answer !== undefined) data.answer = answer;
    if (order !== undefined) data.order = order;
    const faq = await prisma.faq.update({
      where: { id: req.params.faqId },
      data,
    });
    res.json(faq);
  })
);

router.delete(
  '/:id/faqs/:faqId',
  asyncHandler(async (req, res) => {
    await prisma.faq.delete({ where: { id: req.params.faqId } });
    res.json({ ok: true });
  })
);

export default router;
