/** Lightweight date utilities — no external dependency needed */

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function format(date: Date, fmt: string): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());

  return fmt
    .replace('YYYY', String(y))
    .replace('MM', m)
    .replace('DD', d)
    .replace('HH', h)
    .replace('mm', min);
}

export function formatDisplay(dateStr: string, locale = 'es-AR'): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function nightsBetween(from: string, to: string): number {
  const a = new Date(from);
  const b = new Date(to);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function isToday(dateStr: string): boolean {
  return dateStr === format(new Date(), 'YYYY-MM-DD');
}

export function isTomorrow(dateStr: string): boolean {
  return dateStr === format(addDays(new Date(), 1), 'YYYY-MM-DD');
}
