import { localDay, validDay } from './rules.mjs';
export function weekDays(day) {
  const d = new Date((validDay(day) ? day : localDay()) + 'T12:00:00-03:00');
  const offset = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setUTCDate(x.getUTCDate() + i);
    return localDay(x);
  });
}
export function addDays(day, n) {
  const d = new Date((validDay(day) ? day : localDay()) + 'T12:00:00-03:00');
  d.setUTCDate(d.getUTCDate() + n);
  return localDay(d);
}
export function calendarEvent(booking) {
  const start = new Date(booking.start);
  const end = new Date(booking.end);
  const hm = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  }).format(start);
  const [h, m] = hm.split(':').map(Number);
  return {
    day: localDay(start),
    row: Math.floor((h * 60 + m - 420) / 30) + 1,
    span: Math.max(1, Math.ceil((+end - +start) / 1800000)),
  };
}
