export const HOUR = 3600000;
export const DEFAULT_SERVICES = [
  { id: 'corte', name: 'Corte', minutes: 60, price: 5000, sunday: 0, active: 1 },
  { id: 'combo', name: 'Corte e barba', minutes: 90, price: 7500, sunday: 0, active: 1 },
  { id: 'noivo', name: 'Dia do Noivo', minutes: 180, price: 35000, sunday: 1, active: 1 },
];
export function localDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
export function instant(day, time) {
  return new Date(`${day}T${time}:00-03:00`);
}
export function validDay(day) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    !Number.isNaN(instant(day, '12:00').getTime()) &&
    localDay(instant(day, '12:00')) === day
  );
}
export function deposit(price) {
  return Math.round(price / 4);
}
export function slotsFor(start, minutes) {
  return Array.from({ length: minutes / 30 }, (_, i) =>
    new Date(new Date(start).getTime() + i * 1800000).toISOString()
  );
}
export function validateBooking(service, day, time, now = new Date(), released = false) {
  if (!service || !service.active) throw Error('Serviço indisponível.');
  if (!validDay(day) || !/^([01]\d|2[0-3]):(00|30)$/.test(time))
    throw Error('Data ou horário inválido.');
  const start = instant(day, time);
  const end = new Date(+start + service.minutes * 60000);
  const sunday = instant(day, '12:00').getUTCDay() === 0;
  if (sunday !== Boolean(service.sunday))
    throw Error(
      sunday ? 'Domingo é exclusivo para Dia do Noivo.' : 'Dia do Noivo é exclusivo de domingo.'
    );
  if (start < instant(day, '07:00') || end > instant(day, '20:00'))
    throw Error('O atendimento deve ocorrer entre 07h e 20h.');
  if (+start < +now) throw Error('Este horário já passou.');
  if (+start - +now < 2 * HOUR && !released)
    throw Error('Reserve com pelo menos 2 horas de antecedência.');
  if (+start - +now > 90 * 24 * HOUR) throw Error('Escolha uma data nos próximos 90 dias.');
  return { start: start.toISOString(), end: end.toISOString(), urgent: +start - +now < 2 * HOUR };
}
export function availability(service, day, occupied = [], released = [], now = new Date()) {
  if (!validDay(day)) throw Error('Data inválida.');
  const busy = new Set(occupied);
  const free = new Set(released);
  const result = [];
  for (let m = 420; m < 1200; m += 30) {
    const time = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    try {
      const x = validateBooking(
        service,
        day,
        time,
        now,
        free.has(instant(day, time).toISOString())
      );
      if (!slotsFor(x.start, service.minutes).some((s) => busy.has(s))) result.push({ time, ...x });
    } catch {}
  }
  return result;
}
export function customer(data, now = new Date()) {
  const name = String(data.name || '').trim();
  const phone = String(data.phone || '').replace(/\D/g, '');
  const birth = String(data.birth || '');
  const email = String(data.email || '').trim();
  if (name.length < 5 || name.length > 100 || !name.includes(' '))
    throw Error('Informe o nome completo.');
  if (!/^\d{10,13}$/.test(phone)) throw Error('Informe celular com DDD.');
  if (!validDay(birth) || birth > localDay(now) || birth < '1900-01-01')
    throw Error('Informe uma data de nascimento válida.');
  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150))
    throw Error('E-mail inválido.');
  return { name, phone, birth, email };
}
export function canTransition(status, next, start, now = new Date()) {
  if (next === 'cancelled') return ['pending', 'confirmed'].includes(status);
  if (next === 'confirmed') return status === 'pending';
  if (['completed', 'absent'].includes(next))
    return status === 'confirmed' && +new Date(start) <= +now;
  return false;
}
export function summarize(bookings, expenses, days) {
  const done = bookings.filter((b) => b.status === 'completed');
  const revenue = done.reduce((a, b) => a + b.price, 0);
  const cost = expenses.reduce((a, b) => a + b.amount, 0);
  return {
    revenue,
    cost,
    profit: revenue - cost,
    daily: (revenue - cost) / Math.max(days, 1),
    deposits: bookings
      .filter((b) => b.paid_at && b.status !== 'completed')
      .reduce((a, b) => a + b.deposit, 0),
    completed: done.length,
  };
}
export function financialRange(from, to) {
  if (!validDay(from) || !validDay(to))
    return { valid: false, days: 0, error: 'Preencha as duas datas do período.' };
  if (from > to)
    return {
      valid: false,
      days: 0,
      error: 'A data inicial deve ser igual ou anterior à data final.',
    };
  return {
    valid: true,
    days: Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1,
    error: '',
  };
}
