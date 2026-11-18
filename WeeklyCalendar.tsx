import { formatBookingTime } from './formatters';
import { useState } from 'react';
import { weekDays, addDays, calendarEvent } from './calendar.mjs';
import { localDay } from './rules.mjs';
type Booking = {
  id: string;
  name: string;
  service_name: string;
  start: string;
  end: string;
  status: string;
};
const statusLabel: Record<string, string> = {
  confirmed: 'Confirmado',
  pending: 'Aguardando sinal',
  completed: 'Concluído',
  absent: 'Não compareceu',
};

export default function WeeklyCalendar({
  bookings,
  day,
  selectDay,
  sundayOpen,
}: {
  bookings: Booking[];
  day: string;
  selectDay: (day: string) => void;
  sundayOpen: boolean;
}) {
  const days = weekDays(day);
  const [selected, setSelected] = useState<string | null>(null);
  const events = bookings.filter(
    (b) =>
      ['confirmed', 'pending', 'completed', 'absent'].includes(b.status) &&
      days.includes(localDay(new Date(b.start)))
  );
  const chosen = events.find((b) => b.id === selected);
  return (
    <section className="panel weekly-panel">
      <div className="calendar-toolbar">
        <div>
          <h2>Agenda da semana</h2>
          <p>
            {days[0].split('-').reverse().join('/')} a {days[6].split('-').reverse().join('/')}
          </p>
        </div>
        <div className="calendar-navigation">
          <button onClick={() => selectDay(addDays(day, -7))} aria-label="Semana anterior">
            ←
          </button>
          <button onClick={() => selectDay(localDay())}>Hoje</button>
          <button onClick={() => selectDay(addDays(day, 7))} aria-label="Próxima semana">
            →
          </button>
        </div>
      </div>
      <div className="calendar-legend">
        <span className="legend-confirmed">Confirmado · ocupado</span>
        <span className="legend-pending">Pendente</span>
        <span className="legend-free">Livre</span>
        <span className="legend-completed">Concluído</span>
      </div>
      <div className="calendar-scroll">
        <div className="calendar-grid">
          <div className="calendar-corner">Horário</div>
          {days.map((d) => (
            <button
              key={d}
              className={'calendar-day ' + (d === day ? 'chosen-day' : '')}
              onClick={() => selectDay(d)}
            >
              <span>
                {new Date(d + 'T12:00:00-03:00').toLocaleDateString('pt-BR', {
                  timeZone: 'America/Sao_Paulo',
                  weekday: 'short',
                })}
              </span>
              <strong>{Number(d.slice(-2))}</strong>
            </button>
          ))}
          <div className="calendar-hours">
            {Array.from({ length: 26 }, (_, i) => (
              <span
                key={i}
              >{`${String(7 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`}</span>
            ))}
          </div>
          {days.map((d, index) => (
            <div key={d} className="calendar-column">
              {Array.from({ length: 26 }, (_, i) => {
                const h = `${String(7 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`;
                const closed = index === 6 && !sundayOpen;
                const past = new Date(`${d}T${h}:00-03:00`) < new Date();
                return (
                  <div
                    key={i}
                    style={{ gridRow: i + 1 }}
                    className={
                      'calendar-slot ' + (closed ? 'slot-closed' : past ? 'slot-past' : 'slot-free')
                    }
                    title={`${d.split('-').reverse().join('/')} ${h} · ${closed ? 'Fechado' : past ? 'Horário passado' : 'Livre, sujeito às regras de agendamento'}`}
                  />
                );
              })}
              {events
                .filter((b) => localDay(new Date(b.start)) === d)
                .map((b) => {
                  const model = calendarEvent(b);
                  return (
                    <button
                      key={b.id}
                      className={'calendar-event event-' + b.status}
                      style={{ gridRow: `${model.row} / span ${model.span}` }}
                      title={`${b.name} · ${b.service_name} · ${formatBookingTime(b.start)}–${formatBookingTime(b.end)} · ${statusLabel[b.status]}`}
                      onClick={() => {
                        setSelected(b.id);
                        selectDay(d);
                      }}
                    >
                      <strong>
                        {formatBookingTime(b.start)}–{formatBookingTime(b.end)}
                      </strong>
                      <span>{b.name}</span>
                      <small>{b.service_name}</small>
                      <small>{statusLabel[b.status]}</small>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
      {chosen && (
        <div className={'calendar-detail detail-' + chosen.status}>
          <div>
            <strong>{chosen.name}</strong>
            <span>
              {chosen.service_name} · {formatBookingTime(chosen.start)} às{' '}
              {formatBookingTime(chosen.end)} · {statusLabel[chosen.status]}
            </span>
          </div>
          <button className="ghost" onClick={() => setSelected(null)} aria-label="Fechar detalhes">
            ×
          </button>
        </div>
      )}
      <p className="calendar-note">
        Clique no dia ou no atendimento para consultar os detalhes abaixo. O verde indica espaço
        livre; duração e antecedência são verificadas ao agendar. Domingos seguem a disponibilidade
        do Dia do Noivo.
      </p>
    </section>
  );
}
