import { useState } from 'react';
import { formatMoney } from './formatters';
import { financeSeries } from './finance-series.mjs';
import type { Booking, Expense } from './types';

const metrics = [
  { key: 'revenue', label: 'Faturamento', color: '#202622', dash: undefined },
  { key: 'cost', label: 'Despesas', color: '#c73543', dash: '8 3' },
  { key: 'profit', label: 'Lucro estimado', color: '#21824b', dash: '3 3' },
  { key: 'daily', label: 'Média por dia', color: '#246dd1', dash: '10 3 2 3' },
] as const;

export default function FinanceChart({ bookings, expenses, from, to }: {
  bookings: Booking[]; expenses: Expense[]; from: string; to: string;
}) {
  const [active, setActive] = useState<string>('');
  const points = financeSeries(bookings, expenses, from, to);
  if (!points.length) return null;
  const values = points.flatMap(p => metrics.map(m => p[m.key]));
  const min = Math.min(0, ...values);
  const max = Math.max(100, ...values);
  const padding = (max - min) * 0.1;
  const low = min < 0 ? min - padding : 0;
  const high = max + padding;
  const x = (i: number) => points.length === 1 ? 410 : 96 + i * 650 / (points.length - 1);
  const y = (value: number) => 28 + (high - value) / (high - low) * 250;
  const selected = points.find(p => p.from === active) || points[points.length - 1];
  const date = (day: string) => day.slice(8, 10) + '/' + day.slice(5, 7) + '/' + day.slice(0, 4);
  const monthly = points.some(p => p.days > 1);
  const tick = (day: string) => monthly ? day.slice(5, 7) + '/' + day.slice(2, 4)
    : day.slice(8, 10) + '/' + day.slice(5, 7);
  return (
    <section className="panel finance-chart" aria-label="Gráfico de evolução financeira">
      <h2>Evolução financeira</h2>
      <p>{monthly ? 'Valores por período' : 'Valores por dia'} entre {date(from)} e {date(to)}.</p>
      <ul className="finance-legend" aria-label="Legenda do gráfico">
        {metrics.map(m => <li key={m.key}><span style={{ background: m.color }} />{m.label}</li>)}
      </ul>
      <div className="finance-plot">
        <svg viewBox="0 0 780 342" role="img" aria-label="Faturamento, despesas, lucro e média diária em reais ao longo do período">
          <title>Evolução financeira de {date(from)} a {date(to)}</title>
          <rect x="96" y="28" width="650" height="250" fill="#fffefa" />
          {Array.from({ length: 6 }, (_, i) => {
            const value = low + (high - low) * i / 5;
            return <g key={i}><line x1="96" x2="746" y1={y(value)} y2={y(value)} stroke="#d8dfd7" />
              <text x="86" y={y(value) + 4} textAnchor="end">{formatMoney(value)}</text></g>;
          })}
          <line x1="96" x2="746" y1={y(0)} y2={y(0)} stroke="#718075" />
          {points.map((p, i) => (i % Math.max(1, Math.ceil(points.length / 8)) === 0 || i === points.length - 1) &&
            <text key={p.from} x={x(i)} y="302" textAnchor="middle">{tick(p.from)}</text>)}
          <text x="420" y="332" textAnchor="middle">{monthly ? 'Períodos' : 'Dias'} · valores em R$</text>
          {metrics.map(m => <g key={m.key}>
            <polyline fill="none" stroke={m.color} strokeWidth="2.5" strokeDasharray={m.dash}
              points={points.map((p, i) => `${x(i)},${y(p[m.key])}`).join(' ')} />
            {points.map((p, i) => <circle key={p.from} cx={x(i)} cy={y(p[m.key])} r="3.5" fill={m.color}>
              <title>{date(p.from)}{p.to !== p.from ? ' a ' + date(p.to) : ''} · {m.label}: {formatMoney(p[m.key])}</title>
            </circle>)}
          </g>)}
        </svg>
      </div>
      <label className="finance-point">Consultar valores
        <select value={selected.from} onChange={e => setActive(e.target.value)}>
          {points.map(p => <option value={p.from} key={p.from}>{date(p.from)}{p.to !== p.from ? ' a ' + date(p.to) : ''}</option>)}
        </select>
      </label>
      <dl className="finance-point-values">
        {metrics.map(m => <div key={m.key}><dt>{m.label}</dt><dd>{formatMoney(selected[m.key])}</dd></div>)}
      </dl>
      <small>Faturamento considera atendimentos concluídos. Lucro = faturamento − despesas.
        Média por dia = lucro do intervalo dividido pelos dias corridos, incluindo dias sem movimento.
        Valores abaixo de zero indicam prejuízo.</small>
    </section>
  );
}
