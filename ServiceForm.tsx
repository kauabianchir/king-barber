import { useState } from 'react';
import ValidatedForm from './ValidatedForm';
import type { Service } from './types';

export default function ServiceForm({
  service,
  busy,
  save,
}: {
  service: Service;
  busy: boolean;
  save: (x: Record<string, unknown>) => Promise<boolean>;
}) {
  const [price, setPrice] = useState(String(service.price / 100));
  const [minutes, setMinutes] = useState(service.minutes);
  const [active, setActive] = useState(Boolean(service.active));
  return (
    <ValidatedForm
      className="panel"
      onSubmit={(e) => {
        e.preventDefault();
        save({
          action: 'service',
          id: service.id,
          price: Math.round(Number(price) * 100),
          minutes,
          active,
        });
      }}
    >
      <h2>{service.name}</h2>
      <label>
        Preço (R$){' '}
        <span className="required-star" aria-hidden="true">
          *
        </span>
        <input
          type="number"
          step="0.01"
          min="1"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <small className="field-error">Preencha este campo com um valor válido.</small>
      </label>
      <label>
        Duração (minutos){' '}
        <span className="required-star" aria-hidden="true">
          *
        </span>
        <input
          type="number"
          min="30"
          max="780"
          step="30"
          required
          disabled={service.id !== 'noivo'}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        />
        <small className="field-error">Preencha este campo com um valor válido.</small>
      </label>
      <label className="checkbox">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />{' '}
        Disponível para agendamento
      </label>
      <button disabled={busy} className="primary">
        Salvar serviço
      </button>
    </ValidatedForm>
  );
}
