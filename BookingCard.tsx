import type { Booking } from './types';
import { formatMoney, formatBookingDate, formatBookingTime, formatPhone } from './formatters';
const labels: Record<string, string> = {
  pending: 'Aguardando sinal',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  expired: 'Prazo expirado',
  absent: 'Não compareceu',
};
type Props = {
  booking: Booking;
  admin?: boolean;
  busy: boolean;
  onAction: (body: Record<string, unknown>) => Promise<boolean>;
};
export default function BookingCard({ booking, admin = false, busy, onAction }: Props) {
  return (
    <article className="booking">
      <div className="datebox">
        <strong>{formatBookingTime(booking.start)}</strong>
        <span>{formatBookingDate(booking.start)}</span>
      </div>
      <div className="bookinginfo">
        <strong>{booking.service_name}</strong>
        <span>
          {booking.name} · até {formatBookingTime(booking.end)}
        </span>
        {admin && (
          <small>
            {formatPhone(booking.phone)} · {formatMoney(booking.price)} · sinal {formatMoney(booking.deposit)}
          </small>
        )}
      </div>
      <span className={'badge ' + booking.status}>{labels[booking.status]}</span>
      <div className="actions">
        {admin && booking.status === 'pending' && (
          <button
            disabled={busy}
            onClick={() => {
              if (
                confirm(
                  `Confirma o recebimento de ${formatMoney(booking.deposit)} de sinal de ${booking.name}?`
                )
              )
                onAction({ action: 'status', id: booking.id, status: 'confirmed' });
            }}
          >
            Confirmar sinal
          </button>
        )}
        {admin && booking.status === 'confirmed' && new Date(booking.start) <= new Date() && (
          <>
            <button
              disabled={busy}
              onClick={() => onAction({ action: 'status', id: booking.id, status: 'completed' })}
            >
              Concluir
            </button>
            <button
              className="ghost"
              disabled={busy}
              onClick={() => onAction({ action: 'status', id: booking.id, status: 'absent' })}
            >
              Registrar falta
            </button>
          </>
        )}
        {['pending', 'confirmed'].includes(booking.status) && (
          <button
            className="ghost"
            disabled={busy}
            onClick={() => {
              if (
                confirm(
                  'Cancelar e liberar o horário? Acertos de sinal são combinados com o barbeiro.'
                )
              )
                onAction({ action: 'status', id: booking.id, status: 'cancelled' });
            }}
          >
            Cancelar
          </button>
        )}
      </div>
    </article>
  );
}
