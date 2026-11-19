import { PGlite } from '@electric-sql/pglite';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { summarize } from './rules.mjs';
const startedAt = new Date().toISOString();
const db = new PGlite();
const admin = '00000000-0000-4000-8000-000000000001';
const client = '00000000-0000-4000-8000-000000000002';
const events = [];
const checks = [];
await db.exec(
  `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}'::jsonb);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`
);
await db.exec(readFileSync('database.sql', 'utf8'));
await db.query(
  "insert into auth.users values($1,'admin@example.test',now(),'{}'),($2,'cliente@example.test',now(),'{}')",
  [admin, client]
);
await db.query('insert into private.admins values($1)', [admin]);
async function api(uid, payload = {}) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
  await db.exec('set role authenticated');
  const r = (await db.query('select public.king_api($1::jsonb) result', [JSON.stringify(payload)]))
    .rows[0].result;
  if (payload.action)
    events.push({
      at: new Date().toISOString(),
      role: uid === admin ? 'administrador' : 'cliente',
      action: payload.action,
      status: r.status,
    });
  return r;
}
async function check(name, fn) {
  await fn();
  checks.push({ name, status: 'PASS', at: new Date().toISOString() });
  console.log('PASS ' + name);
}
let day = new Date(Date.now() + 3 * 86400000);
while (day.getUTCDay() === 0) day = new Date(+day + 86400000);
day = day.toISOString().slice(0, 10);
const form = {
  action: 'book',
  service: 'corte',
  day,
  time: '10:00',
  name: 'Cliente de Teste',
  phone: '14999999999',
  birth: '2000-01-01',
  email: '',
};
let booking;
try {
  await check('Reserva, sinal e cancelamento pelo servidor', async () => {
    const r = await api(client, form);
    assert.equal(r.status, 201);
    booking = r.body.id;
    assert.equal(
      (await api(admin, { action: 'status', id: booking, status: 'confirmed' })).status,
      200
    );
    const b = (await api(client)).body.bookings.find((b) => b.id === booking);
    assert.equal(b.deposit, 1250);
    assert.ok(b.paid_at);
    assert.equal(b.status, 'confirmed');
    assert.equal(
      (await api(client, { action: 'status', id: booking, status: 'cancelled' })).status,
      200
    );
    assert.ok(
      (await api(client, { action: 'slots', service: 'corte', day })).body.slots.some(
        (s) => s.time === '10:00'
      )
    );
  });
  await check('Configuração não altera preço e duração já contratados', async () => {
    const r = await api(client, { ...form, time: '12:00', service: 'combo' });
    assert.equal(r.status, 201);
    assert.equal(
      (await api(admin, { action: 'service', id: 'combo', price: 8000, minutes: 90, active: true }))
        .status,
      200
    );
    const b = (await api(client)).body.bookings.find((b) => b.id === r.body.id);
    assert.equal(b.price, 7500);
    assert.equal((+new Date(b.end) - +new Date(b.start)) / 60000, 90);
    assert.equal(
      (
        await api(admin, {
          action: 'service',
          id: 'noivo',
          price: 35000,
          minutes: 210,
          active: false,
        })
      ).status,
      200
    );
    assert.equal((await api(client, { ...form, service: 'noivo' })).status, 400);
  });
  await check('Conclusão e falta exigem administrador e estados finais não reabrem', async () => {
    await db.exec('reset role');
    for (const [id, time] of [
      ['00000000-0000-4000-8000-000000000090', '2 hours'],
      ['00000000-0000-4000-8000-000000000091', '3 hours'],
    ]) {
      await db.query(
        `insert into private.bookings(id,user_id,name,phone,birth,service_id,service_name,start,"end",price,deposit,status,paid_at) values($1,$2,'Atendimento Teste','14999999999','2000-01-01','corte','Corte',now()-$3::interval,now()-$3::interval+interval '1 hour',5000,1250,'confirmed',now())`,
        [id, client, time]
      );
    }
    const done = '00000000-0000-4000-8000-000000000090',
      absent = '00000000-0000-4000-8000-000000000091';
    assert.equal(
      (await api(client, { action: 'status', id: done, status: 'completed' })).status,
      403
    );
    assert.equal(
      (await api(admin, { action: 'status', id: done, status: 'completed' })).status,
      200
    );
    assert.equal(
      (await api(admin, { action: 'status', id: absent, status: 'absent' })).status,
      200
    );
    assert.equal(
      (await api(admin, { action: 'status', id: done, status: 'confirmed' })).status,
      400
    );
    const data = (await api(admin)).body;
    assert.equal(data.bookings.find((b) => b.id === done).status, 'completed');
    assert.equal(data.bookings.find((b) => b.id === absent).status, 'absent');
  });
  await check('Financeiro usa conclusão, sinal único e despesa reversível', async () => {
    assert.equal(
      (await api(admin, { action: 'expense', day, description: 'Material de teste', amount: 1000 }))
        .status,
      201
    );
    let data = (await api(admin)).body;
    let totals = summarize(data.bookings, data.expenses, 2);
    assert.equal(totals.revenue, 5000);
    assert.equal(totals.cost, 1000);
    assert.equal(totals.profit, 4000);
    assert.equal(totals.daily, 2000);
    const id = data.expenses[0].id;
    assert.equal((await api(admin, { action: 'deleteExpense', id })).status, 200);
    data = (await api(admin)).body;
    assert.equal(summarize(data.bookings, data.expenses, 2).profit, 5000);
    assert.equal((await api(admin, { action: 'restoreExpense', id })).status, 200);
    data = (await api(admin)).body;
    assert.equal(summarize(data.bookings, data.expenses, 2).profit, 4000);
    assert.equal((await api(admin, { action: 'restoreExpense', id })).status, 400);
  });
  await check('Cliente recebe avisos das suas reservas e leitura persiste', async () => {
    const data = (await api(client)).body;
    assert.ok(data.notifications.some((n) => n.kind === 'confirmed'));
    assert.ok(data.notifications.some((n) => n.title === 'Agendamento cancelado'));
    assert.equal((await api(client, { action: 'readNotifications' })).status, 200);
    assert.ok((await api(client)).body.notifications.every((n) => n.read_at));
  });
} finally {
  writeFileSync(
    'acceptance-test-results.json',
    JSON.stringify(
      {
        scope:
          'Validação técnica atual em Postgres/PGlite isolado, com SQL da aplicação e identidades sintéticas. Não representa atendimentos ou pagamentos de clientes.',
        startedAt,
        finishedAt: new Date().toISOString(),
        checks,
        events,
      },
      null,
      2
    )
  );
  await db.close();
}
