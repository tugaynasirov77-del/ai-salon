// SMS-канал. Провайдер по умолчанию — sms.ru (env SMS_PROVIDER=smsru|smsc).
// API sms.ru: https://sms.ru/?panel=api&subpanel=method&show=sms/send
// Ключ настраивается в env: SMS_API_KEY. Опционально SMS_SENDER — имя отправителя (требует одобрения у sms.ru).
const PROVIDER = (process.env.SMS_PROVIDER || 'smsru').toLowerCase();
const API_KEY = process.env.SMS_API_KEY || '';
const SENDER = process.env.SMS_SENDER || '';
const TEST_MODE = process.env.SMS_TEST === '1';

const MAX_SMS_LEN = 480; // 3 SMS-сегмента в utf-8, дальше режем

// Нормализация: возвращает 11-значный номер начиная с 7 (РФ-стандарт для SMS API).
// null — если номер некорректный.
export function normalizePhoneRu(raw: string): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) return '7' + digits.slice(1);
  if (digits.length === 11 && digits.startsWith('7')) return digits;
  if (digits.length === 10) return '7' + digits;
  return null;
}

export async function sendSMS(toRaw: string, text: string): Promise<boolean> {
  if (!API_KEY) {
    console.warn('[sms] SMS_API_KEY не задан — пропускаем отправку');
    return false;
  }
  const phone = normalizePhoneRu(toRaw);
  if (!phone) {
    console.warn(`[sms] некорректный номер: ${toRaw}`);
    return false;
  }
  const msg = text.length > MAX_SMS_LEN ? text.slice(0, MAX_SMS_LEN - 1) + '…' : text;

  try {
    if (PROVIDER === 'smsru') return await sendViaSmsRu(phone, msg);
    if (PROVIDER === 'smsc') return await sendViaSmsc(phone, msg);
    console.warn(`[sms] неизвестный провайдер: ${PROVIDER}`);
    return false;
  } catch (err) {
    console.error('[sms.sendSMS] error:', err);
    return false;
  }
}

async function sendViaSmsRu(phone: string, msg: string): Promise<boolean> {
  const url = new URL('https://sms.ru/sms/send');
  url.searchParams.set('api_id', API_KEY);
  url.searchParams.set('to', phone);
  url.searchParams.set('msg', msg);
  url.searchParams.set('json', '1');
  if (SENDER) url.searchParams.set('from', SENDER);
  if (TEST_MODE) url.searchParams.set('test', '1');

  const res = await fetch(url.toString());
  const data = (await res.json()) as any;
  if (data?.status !== 'OK') {
    console.warn(`[sms.smsru] отказ: ${data?.status_text || JSON.stringify(data)}`);
    return false;
  }
  const phoneStatus = data?.sms?.[phone];
  if (phoneStatus?.status !== 'OK') {
    console.warn(`[sms.smsru] phone ${phone}: ${phoneStatus?.status_text || JSON.stringify(phoneStatus)}`);
    return false;
  }
  console.log(`[sms.smsru] отправлено sms_id=${phoneStatus.sms_id} balance=${data.balance}`);
  return true;
}

async function sendViaSmsc(phone: string, msg: string): Promise<boolean> {
  // SMSC.ru: login + password в SMS_API_KEY как "login:password"
  const [login, password] = API_KEY.split(':');
  if (!login || !password) {
    console.warn('[sms.smsc] SMS_API_KEY должен быть в формате "login:password"');
    return false;
  }
  const url = new URL('https://smsc.ru/sys/send.php');
  url.searchParams.set('login', login);
  url.searchParams.set('psw', password);
  url.searchParams.set('phones', phone);
  url.searchParams.set('mes', msg);
  url.searchParams.set('fmt', '3'); // json
  if (SENDER) url.searchParams.set('sender', SENDER);
  if (TEST_MODE) url.searchParams.set('cost', '1'); // dry-run cost check

  const res = await fetch(url.toString());
  const data = (await res.json()) as any;
  if (data?.error) {
    console.warn(`[sms.smsc] error: ${data.error}`);
    return false;
  }
  console.log(`[sms.smsc] отправлено id=${data?.id} cnt=${data?.cnt}`);
  return true;
}
