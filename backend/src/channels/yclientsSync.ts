// Обработка входящих webhook-событий от YClients: их записи → наши Appointment.
// Регистрация URL: https://api.ailiva.ru/webhook/yclients (без подписи — фильтр по company_id).
import prisma from '../db/prisma';
import { scheduleReminders } from '../queues/reminderWorker';
import { alertError, alertWarn } from '../utils/alerter';
import type { IAppointment } from '../../../shared/types';

// Формат webhook от YClients (стандарт):
// { company_id, resource, status, data: {...} }
export type YClientsWebhookEvent = {
  company_id?: number;
  resource?: string; // 'record' | 'goods_operations' | ...
  status?: 'create' | 'update' | 'delete';
  data?: any;
};

// Маппим attendance YClients → наш status
// -1 = не пришёл, 0 = ожидание, 1 = пришёл, 2 = подтверждён
function mapStatus(attendance?: number, deleted?: boolean): string {
  if (deleted) return 'cancelled';
  if (attendance === -1) return 'cancelled';
  if (attendance === 1) return 'completed';
  return 'confirmed';
}

export async function handleYClientsEvent(event: YClientsWebhookEvent): Promise<void> {
  if (event.resource !== 'record') {
    // Не интересуемся прочими ресурсами (товары, кассы и т.д.)
    return;
  }
  const companyId = event.company_id || event.data?.company_id;
  if (!companyId) {
    console.warn('[yclients-webhook] нет company_id в payload');
    return;
  }

  const salon = await prisma.salon.findFirst({
    where: { yclientsCompanyId: String(companyId) },
    select: {
      id: true,
      yclientsServiceMap: true,
      yclientsStaffMap: true,
    },
  });
  if (!salon) {
    console.warn(`[yclients-webhook] салон с companyId=${companyId} не найден`);
    return;
  }

  const data = event.data || {};
  const recordId = String(data.id);
  if (!recordId || recordId === 'undefined') {
    console.warn('[yclients-webhook] нет id записи в data');
    return;
  }

  // Обратный маппинг: yclientsServiceId → наш serviceId
  const serviceMap = (salon.yclientsServiceMap as Record<string, number>) || {};
  const staffMap = (salon.yclientsStaffMap as Record<string, number>) || {};
  const invertedServices: Record<string, string> = {};
  for (const [ourId, yId] of Object.entries(serviceMap)) invertedServices[String(yId)] = ourId;
  const invertedStaff: Record<string, string> = {};
  for (const [ourId, yId] of Object.entries(staffMap)) invertedStaff[String(yId)] = ourId;

  const status = event.status || 'create';

  // ── DELETE ──
  if (status === 'delete') {
    const existing = await prisma.appointment.findUnique({ where: { yclientsRecordId: recordId } });
    if (!existing) return;
    await prisma.appointment.update({
      where: { id: existing.id },
      data: { status: 'cancelled' },
    });
    console.log(`[yclients-webhook] cancel record=${recordId} → appointment=${existing.id}`);
    return;
  }

  // ── UPDATE ──
  if (status === 'update') {
    const existing = await prisma.appointment.findUnique({ where: { yclientsRecordId: recordId } });
    if (!existing) {
      // Если в нашей БД нет — обрабатываем как create
      await createFromYClients(salon.id, recordId, data, invertedServices, invertedStaff);
      return;
    }
    const newDt = data.datetime ? new Date(data.datetime) : existing.datetime;
    const updated = await prisma.appointment.update({
      where: { id: existing.id },
      data: {
        datetime: newDt,
        status: mapStatus(data.attendance, data.deleted),
        reminder24h: false,
        reminder2h: false,
      },
    });
    if (newDt.getTime() !== existing.datetime.getTime()) {
      await scheduleReminders(updated as unknown as IAppointment).catch((e) =>
        console.error('[yclients-webhook] scheduleReminders error:', e?.message)
      );
    }
    console.log(`[yclients-webhook] update record=${recordId} → appointment=${existing.id}`);
    return;
  }

  // ── CREATE ──
  // Проверяем что это не эхо нашей же sync (создавали мы → YClients прислал нам обратно)
  const existing = await prisma.appointment.findUnique({ where: { yclientsRecordId: recordId } });
  if (existing) {
    console.log(`[yclients-webhook] skip echo: record=${recordId} уже у нас (${existing.id})`);
    return;
  }
  await createFromYClients(salon.id, recordId, data, invertedServices, invertedStaff);
}

async function createFromYClients(
  salonId: string,
  recordId: string,
  data: any,
  invertedServices: Record<string, string>,
  invertedStaff: Record<string, string>
): Promise<void> {
  const phoneRaw = data.client?.phone || '';
  const phone = String(phoneRaw).replace(/[^\d+]/g, '');
  const clientName = data.client?.name || 'Клиент';

  // Найти/создать клиента
  let client = phone
    ? await prisma.client.findFirst({ where: { salonId, phone } })
    : null;
  if (!client) {
    client = await prisma.client.create({
      data: {
        salonId,
        name: clientName,
        phone: phone || null,
        preferredChannel: 'yclients',
      },
    });
  }

  const firstService = data.services?.[0] || {};
  const serviceTitle = firstService.title || data.service || 'Услуга';
  const ourServiceId = firstService.id ? invertedServices[String(firstService.id)] : undefined;
  const ourMasterId = data.staff_id ? invertedStaff[String(data.staff_id)] : undefined;
  const masterName = data.staff?.name || null;

  const datetime = data.datetime ? new Date(data.datetime) : new Date();

  try {
    const appointment = await prisma.appointment.create({
      data: {
        salonId,
        clientId: client.id,
        serviceId: ourServiceId || null,
        masterId: ourMasterId || null,
        service: serviceTitle,
        master: masterName,
        datetime,
        status: mapStatus(data.attendance, data.deleted),
        source: 'yclients',
        yclientsRecordId: recordId,
      },
    });
    await scheduleReminders(appointment as unknown as IAppointment).catch((e) =>
      console.error('[yclients-webhook] scheduleReminders error:', e?.message)
    );
    console.log(
      `[yclients-webhook] create record=${recordId} → appointment=${appointment.id} (client=${client.id})`
    );
  } catch (e: any) {
    // Гонка: одновременно прилетели create+update — yclientsRecordId уникален, словим P2002
    if (e?.code === 'P2002') {
      console.log(`[yclients-webhook] race на recordId=${recordId} — игнор`);
      return;
    }
    console.error(`[yclients-webhook] create FAIL record=${recordId}:`, e?.message);
    alertError(
      'YClients webhook create FAIL',
      { salonId, recordId, error: e?.message },
      `yclients-wh-fail:${salonId}`
    );
  }

  // Если маппинг не нашёлся — предупреждаем владельца
  if (!ourServiceId || !ourMasterId) {
    alertWarn(
      'YClients webhook: нет обратного маппинга',
      {
        salonId,
        recordId,
        yServiceId: firstService.id,
        yStaffId: data.staff_id,
        gotService: !!ourServiceId,
        gotMaster: !!ourMasterId,
      },
      `yclients-wh-nomap:${salonId}`
    );
  }
}
