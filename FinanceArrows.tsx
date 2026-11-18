import { formatMoney } from './formatters';

export default function FinanceArrows({
  revenue,
  cost,
  profit,
  daily,
}: {
  revenue: number;
  cost: number;
  profit: number;
  daily: number;
}) {
  const metrics = [
    { label: 'Faturamento', value: revenue, kind: 'revenue' },
    { label: 'Despesas', value: cost, kind: 'cost' },
    { label: 'Lucro estimado', value: profit, kind: 'profit' },
    { label: 'Média por dia', value: daily, kind: 'daily' },
  ];
  const max = Math.max(1, ...metrics.map((m) => Math.abs(m.value)));
  return (
    <section className="panel finance-arrows" aria-label="Gráfico financeiro de setas">
      <h2>Resumo financeiro</h2>
      <p>Comprimento das setas proporcional ao valor no período selecionado.</p>
      {metrics.map((m) => (
        <div className={'finance-arrow-row arrow-' + m.kind} key={m.kind}>
          <span>{m.label}</span>
          <div className="arrow-track">
            <i style={{ width: `${(Math.abs(m.value) / max) * 100}%` }} />
            {m.value === 0 && <small>Sem movimento</small>}
          </div>
          <strong>{formatMoney(m.value)}</strong>
        </div>
      ))}
      <small>
        Faturamento em preto, despesas em vermelho, lucro em verde e média diária em azul. O sinal
        negativo indica prejuízo.
      </small>
    </section>
  );
}
