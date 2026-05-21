import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Маска телефона +7 (XXX) XXX-XX-XX
export function formatPhone(value: string): string {
  var digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits[0] === '8') digits = '7' + digits.slice(1);
  if (digits[0] !== '7') digits = '7' + digits;
  var p1 = digits.slice(1, 4);
  var p2 = digits.slice(4, 7);
  var p3 = digits.slice(7, 9);
  var p4 = digits.slice(9, 11);
  var out = '+7';
  if (p1) out += ' (' + p1;
  if (p1.length === 3) out += ')';
  if (p2) out += ' ' + p2;
  if (p3) out += '-' + p3;
  if (p4) out += '-' + p4;
  return out;
}

// Понедельник недели для произвольной даты (локальная зона)
export function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0=вс..6=сб
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

// Прибавить дни
export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

// ISO YYYY-MM-DD в локальной зоне (для запроса в API)
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// "21 мая"
const RU_MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
export function fmtDayMonth(d: Date): string {
  return d.getDate() + ' ' + RU_MONTHS[d.getMonth()];
}

// "пн", "вт", ... "вс"
const RU_WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
export function fmtWeekday(d: Date): string {
  return RU_WEEKDAYS[d.getDay()];
}

// Относительное время (2 мин назад, 1 час назад)
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return Math.floor(diff / 60) + ' мин назад';
  if (diff < 86400) return Math.floor(diff / 3600) + ' ч назад';
  return Math.floor(diff / 86400) + ' дн назад';
}
