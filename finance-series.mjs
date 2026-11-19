import { financialRange, localDay } from './rules.mjs';

export function financeSeries(bookings, expenses, from, to) {
  const range = financialRange(from, to);
  if (!range.valid) return [];
  const first = new Date(from + 'T12:00:00Z');
  const last = new Date(to + 'T12:00:00Z');
  const months = (last.getUTCFullYear() - first.getUTCFullYear()) * 12
    + last.getUTCMonth() - first.getUTCMonth() + 1;
  const daily = range.days <= 31;
  const step = Math.ceil(months / 24);
  const points = [];
  let start = from;
  while (start <= to) {
    const next = new Date(start + 'T12:00:00Z');
    if (daily) next.setUTCDate(next.getUTCDate() + 1);
    else {
      next.setUTCDate(1);
      next.setUTCMonth(next.getUTCMonth() + step);
    }
    const end = new Date(+next - 86400000).toISOString().slice(0, 10);
    const until = end < to ? end : to;
    points.push({ from: start, to: until, days: financialRange(start, until).days,
      revenue: 0, cost: 0, profit: 0, daily: 0 });
    start = next.toISOString().slice(0, 10);
  }
  for (const booking of bookings) {
    if (booking.status !== 'completed') continue;
    const day = localDay(new Date(booking.start));
    const point = points.find(p => day >= p.from && day <= p.to);
    if (point) point.revenue += booking.price;
  }
  for (const expense of expenses) {
    if (expense.deleted_at) continue;
    const point = points.find(p => expense.day >= p.from && expense.day <= p.to);
    if (point) point.cost += expense.amount;
  }
  for (const point of points) {
    point.profit = point.revenue - point.cost;
    point.daily = point.profit / point.days;
  }
  return points;
}
