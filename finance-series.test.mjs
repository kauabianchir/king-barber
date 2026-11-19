import { test } from 'node:test';
import assert from 'node:assert/strict';
import { financeSeries } from './finance-series.mjs';

test('Série usa dias de Brasília, somente concluídos e despesas ativas', () => {
  const points = financeSeries([
    { start: '2026-11-02T01:00:00Z', price: 5000, deposit: 1250, status: 'completed' },
    { start: '2026-11-02T13:00:00Z', price: 7500, status: 'confirmed' },
    { start: '2026-10-30T13:00:00Z', price: 5000, status: 'completed' },
  ], [{ day: '2026-11-01', amount: 6000 },
    { day: '2026-11-01', amount: 9999, deleted_at: '2026-11-01' }], '2026-11-01', '2026-11-03');
  assert.equal(points.length, 3);
  assert.deepEqual(points.map(p => [p.revenue,p.cost,p.profit,p.daily]),
    [[5000,6000,-1000,-1000],[0,0,0,0],[0,0,0,0]]);
});
test('Meses parciais incluem dias sem movimento na média', () => {
  const points = financeSeries([{start:'2026-03-01T12:00:00Z',price:6300,status:'completed'}],
    [{day:'2026-02-28',amount:1000}], '2026-01-31', '2026-03-03');
  assert.deepEqual(points.map(p => p.days), [1,28,3]);
  assert.equal(points[2].daily,2100);
  assert.equal(points.reduce((s,p)=>s+p.profit,0),5300);
});
test('Intervalos inválidos são vazios e períodos longos têm até 24 pontos', () => {
  assert.deepEqual(financeSeries([],[],'2026-02-30','2026-03-01'),[]);
  assert.deepEqual(financeSeries([],[],'2026-11-03','2026-11-01'),[]);
  assert.equal(financeSeries([],[],'2026-11-01','2026-11-01').length,1);
  assert.ok(financeSeries([],[],'2000-01-01','2026-11-19').length <= 24);
});
