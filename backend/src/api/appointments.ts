import { Router } from 'express';
import prisma from '../db/prisma';
import { asyncHandler } from '../middleware/errors';
import { scheduleReminders } from '../queues/reminderWorker';
import { IAppointment } from '../../../shared/types';

const router = Router();

// POST /api/appointments — создать запись
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { salonId, clientId, service, master, datetime } = req.body;
    if (!salonId || !clientId || !service || !datetime) {
      res.status(400).json({ error: 'salonId, clientId, service, datetime обязательны' });
      return;
    }
    const appointment = await prisma.appointment.create({
      data: {
        salonId,
        clientId,
        service,
        master,
        datetime: new Date(datetime),
        status: 'confirmed',
      },
    });
    // Поставим напоминания в очередь
    await scheduleReminders(appointment as unknown as IAppointment);
    res.status(201).json(appointment);
  })
);

// PUT /api/appointments/:id/status
router.put(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const allowed = ['confirmed', 'cancelled', 'completed', 'no_show'];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: `status должен быть одним из: ${allowed.join(', ')}` });
      return;
    }
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(appointment);
  })
);

// PUT /api/appointments/:id — полное обновление (ручная правка из CRM)
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { service, master, serviceId, masterId, datetime, status } = req.body;
    const data: any = {};
    if (service !== undefined) data.service = service;
    if (master !== undefined) data.master = master;
    if (serviceId !== undefined) data.serviceId = serviceId;
    if (masterId !== undefined) data.masterId = masterId;
    if (datetime !== undefined) {
      const dt = new Date(datetime);
      if (isNaN(dt.getTime())) {
        res.status(400).json({ error: 'datetime некорректен' });
        return;
      }
      data.datetime = dt;
      data.reminder24h = false;
      data.reminder2h = false;
    }
    if (status !== undefined) {
      const allowed = ['confirmed', 'cancelled', 'completed', 'no_show'];
      if (!allowed.includes(status)) {
        res.status(400).json({ error: `status: ${allowed.join(', ')}` });
        return;
      }
      data.status = status;
    }
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data,
    });
    if (data.datetime && appointment.status === 'confirmed') {
      await scheduleReminders(appointment as unknown as IAppointment);
    }
    res.json(appointment);
  })
);

// DELETE /api/appointments/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

export default router;
