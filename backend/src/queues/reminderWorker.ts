import { Queue, Worker, JobsOptions } from 'bullmq';
import redis from '../db/redis';
import prisma from '../db/prisma';
import { cascadeSender } from '../channels/cascadeSender';
import { NICHES } from '../../../shared/niches';
import { IAppointment, IClient, ISalon, NicheKey } from '../../../shared/types';

const QUEUE_NAME = 'reminders';

export const reminderQueue = new Queue(QUEUE_NAME, {
  connection: redis,
});

type ReminderJobData = {
  appointmentId: string;
  type: '24h' | '2h';
};

// Поставить два напоминания (за 24ч и за 2ч)
export async function scheduleReminders(appointment: IAppointment): Promise<void> {
  try {
    const at = new Date(appointment.datetime).getTime();
    const now = Date.now();

    const jobs: Array<{ data: ReminderJobData; delay: number }> = [
      { data: { appointmentId: appointment.id, type: '24h' }, delay: at - now - 24 * 3600 * 1000 },
      { data: { appointmentId: appointment.id, type: '2h' }, delay: at - now - 2 * 3600 * 1000 },
    ];

    for (const j of jobs) {
      if (j.delay <= 0) continue; // время уже прошло
      const opts: JobsOptions = {
        delay: j.delay,
        attempts: 3,
        backoff: { type: 'exponential', delay: 60_000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      };
      await reminderQueue.add(`reminder-${j.data.type}`, j.data, opts);
    }
    console.log(`[reminders] запланированы для appointment ${appointment.id}`);
  } catch (err) {
    console.error('[reminders.schedule] error:', err);
  }
}

// Воркер для обработки напоминаний
export function startReminderWorker(): Worker<ReminderJobData> {
  const worker = new Worker<ReminderJobData>(
    QUEUE_NAME,
    async (job) => {
      const { appointmentId, type } = job.data;

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true, salon: true },
      });
      if (!appointment) {
        console.warn(`[reminder-worker] appointment ${appointmentId} не найден`);
        return;
      }
      if (appointment.status !== 'confirmed') {
        console.log(`[reminder-worker] пропускаем — статус ${appointment.status}`);
        return;
      }

      const niche = NICHES[appointment.salon.niche as NicheKey];
      if (!niche) {
        console.warn(`[reminder-worker] неизвестная ниша ${appointment.salon.niche}`);
        return;
      }

      const template = type === '24h' ? niche.reminderTemplates.h24 : niche.reminderTemplates.h2;
      const text = fillTemplate(template, {
        clientName: appointment.client.name || 'клиент',
        time: new Date(appointment.datetime).toLocaleString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        }),
        service: appointment.service,
        salonName: appointment.salon.name,
        address: appointment.salon.address || '',
      });

      await cascadeSender.send(appointment.client as unknown as IClient, text);

      // Отметим, что напоминание отправлено
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: type === '24h' ? { reminder24h: true } : { reminder2h: true },
      });
    },
    { connection: redis }
  );

  worker.on('failed', (job, err) => {
    console.error(`[reminder-worker] job ${job?.id} failed:`, err.message);
  });

  return worker;
}

function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
