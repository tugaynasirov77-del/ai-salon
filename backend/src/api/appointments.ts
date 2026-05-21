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

export default router;
