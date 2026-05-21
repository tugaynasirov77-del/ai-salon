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

// Относительное время (2 мин назад, 1 час назад)
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return Math.floor(diff / 60) + ' мин назад';
  if (diff < 86400) return Math.floor(diff / 3600) + ' ч назад';
  return Math.floor(diff / 86400) + ' дн назад';
}
