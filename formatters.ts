export function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
}
export function formatBookingDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
  });
}
export function formatBookingTime(value: string) {
  return new Date(value).toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  const national = digits.length === 13 && digits.startsWith('55') ? digits.slice(2) : digits;
  if (national.length === 11) return `(${national.slice(0,2)}) ${national.slice(2,7)}-${national.slice(7)}`;
  if (national.length === 10) return `(${national.slice(0,2)}) ${national.slice(2,6)}-${national.slice(6)}`;
  return value;
}
