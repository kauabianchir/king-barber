import BookingCard from './BookingCard';
import ServiceForm from './ServiceForm';
import type { Booking, Data } from './types';
import { formatMoney, formatBookingTime } from './formatters';
import { useEffect, useState } from 'react';
import Brand from './Brand';
import SundayPicker from './SundayPicker';
import FinanceChart from './FinanceChart';
import { nextSunday } from './sundays.mjs';
import { api, logout } from './api';
import AuthPanel from './AuthPanel';
import ValidatedForm from './ValidatedForm';
import ThemeToggle from './ThemeToggle';
import PromoCard from './PromoCard';
import WeeklyCalendar from './WeeklyCalendar';
import NotificationsBell from './NotificationsBell';

import { localDay, deposit, summarize, financialRange } from './rules.mjs';

export default function App() {
  const [data, setData] = useState<Data | null>(null);
  const [view, setView] = useState('reserve');
  const [step, setStep] = useState(1);
  const [service, setService] = useState('corte');
  const [day, setDay] = useState(localDay());
  const [chosen, setChosen] = useState('');
  const [slots, setSlots] = useState<{ time: string; urgent: boolean }[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [signedOut, setSignedOut] = useState(false);
  const [filter, setFilter] = useState(localDay());
  const [from, setFrom] = useState(localDay().slice(0, 7) + '-01');
  const [to, setTo] = useState(localDay());
  const [form, setForm] = useState({ name: '', phone: '', birth: '', email: '' });
  const [expense, setExpense] = useState({ day: localDay(), description: '', value: '' });
  async function loadData() {
    try {
      const response = await api({ action: 'data' });
      const result = await response.json();
      if (response.status === 401) {
        setData(null);
        setSignedOut(true);
        return;
      }
      if (!response.ok) throw Error(result.error);
      setData(result);
      setSignedOut(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível carregar os dados.');
    }
  }
  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 30000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    setChosen('');
    setSlots([]);
  }, [service, day]);
  useEffect(() => {
    let currentRequest = true;

    async function loadAvailableSlots() {
      if (!data || !day) {
        setSlots([]);
        setLoadingSlots(false);
        return;
      }

      setLoadingSlots(true);
      try {
        const response = await api({ action: 'slots', service, day });
        const result = await response.json();
        if (!response.ok) throw Error(result.error);
        if (!currentRequest) return;

        setSlots(result.slots);
        setChosen((selectedTime) =>
          result.slots.some((slot: { time: string }) => slot.time === selectedTime)
            ? selectedTime
            : ''
        );
      } catch (error) {
        if (currentRequest) {
          setSlots([]);
          setChosen('');
          setError(
            error instanceof Error ? error.message : 'Não foi possível consultar os horários.'
          );
        }
      } finally {
        if (currentRequest) setLoadingSlots(false);
      }
    }

    loadAvailableSlots();
    return () => {
      // Ignora a resposta anterior quando o cliente troca a data ou o serviço.
      currentRequest = false;
    };
  }, [service, day, data]);
  async function signOut() {
    setError('');
    try {
      await logout();
    } catch {
      setError('Não foi possível sair. Tente novamente.');
    }
  }
  async function handleAction(body: Record<string, unknown>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await api(body);
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setNotice(result.message);
      await loadData();
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível concluir a operação.');
      return false;
    } finally {
      setBusy(false);
    }
  }
  const selected = data?.services.find((s) => s.id === service);
  const today = data?.bookings.filter((b) => localDay(new Date(b.start)) === filter) || [];
  const mine = data?.bookings.filter((b) => b.user_id === data.user.id) || [];
  const range = financialRange(from, to);
  const period =
    data?.bookings.filter((b) => {
      const d = localDay(new Date(b.start));
      return d >= from && d <= to;
    }) || [];
  const costs = data?.expenses.filter((e) => e.day >= from && e.day <= to) || [];
  const summary = summarize(period, costs, range.days);
  const nav = [
    ['reserve', '＋', 'Agendar horário'],
    ['mine', '◷', 'Meus agendamentos'],
    ...(data?.user.admin
      ? [
          ['agenda', '▦', 'Agenda da barbearia'],
          ['finance', '↗', 'Financeiro'],
          ['settings', '⚙', 'Serviços e preços'],
        ]
      : []),
  ];
  function renderBooking(booking: Booking, admin = false) {
    return (
      <BookingCard
        key={booking.id}
        booking={booking}
        admin={admin}
        busy={busy}
        onAction={handleAction}
      />
    );
  }
  return (
    <div className="shell">
      <aside>
        <Brand />
        <nav>
          {nav.map(([id, icon, label]) => (
            <button
              key={id}
              className={view === id ? 'active' : ''}
              onClick={() => {
                setView(id);
                setError('');
                setNotice('');
              }}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="asidebottom">
          <strong>● Atendimento das 07h às 20h</strong>
          <p>
            De segunda a sábado.
            <br />
            Domingo, somente Dia do Noivo.
          </p>
          <div className="profile">
            <div className="avatar">{data?.user.name.slice(0, 1).toUpperCase() || 'T'}</div>
            <div>
              <strong>{data?.user.admin ? 'Administração' : 'Sua conta'}</strong>
              <small>{data?.user.email || 'Acesso protegido'}</small>
            </div>
          </div>
          {data && (
            <button className="ghost" onClick={signOut}>
              Sair da conta ↗
            </button>
          )}
        </div>
      </aside>
      <main>
        <header>
          <span className="crumb">
            KING BARBER <span>/</span> {nav.find((n) => n[0] === view)?.[2]}
          </span>
          <div className="header-tools">
            <span className="topdate">
              {new Date().toLocaleDateString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            {data && (
              <NotificationsBell
                items={data.notifications || []}
                read={(id) => handleAction({ action: 'readNotifications', id })}
              />
            )}
            <ThemeToggle />
            {data && (
              <button
                className="mobile-signout"
                type="button"
                aria-label="Sair da conta"
                title="Sair da conta"
                onClick={signOut}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M10 4H4v16h6M13 8l4 4-4 4M8 12h13" />
                </svg>
              </button>
            )}
          </div>
        </header>
        {error && (
          <div role="alert" className="alert error">
            {error}
            <button
              className="ghost"
              onClick={() => {
                setError('');
                loadData();
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}
        {notice && (
          <div role="status" className="alert success">
            ✓ {notice}
          </div>
        )}
        {signedOut ? (
          <AuthPanel />
        ) : !data ? (
          <section className="panel">
            <h1>Preparando sua agenda…</h1>
            <p>Estamos consultando os horários disponíveis.</p>
          </section>
        ) : (
          <>
            {view === 'reserve' && (
              <>
                <section className="intro">
                  <p className="eyebrow">SEU TEMPO, BEM CUIDADO</p>
                  <h1>
                    Reserve um momento
                    <br />
                    para você<span>.</span>
                  </h1>
                  <p>Escolha o serviço. Encontre seu horário. Pronto.</p>
                </section>
                <div className="reservation">
                  <section className="panel">
                    <div className="steps">
                      {['Serviço', 'Horário', 'Seus dados', 'Confirmar'].map((s, i) => (
                        <div
                          key={s}
                          className={step === i + 1 ? 'current' : step > i + 1 ? 'done' : ''}
                        >
                          <b>{step > i + 1 ? '✓' : i + 1}</b>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                    {step === 1 && (
                      <>
                        <p className="eyebrow">01 / ESCOLHA O SERVIÇO</p>
                        <h2>Como vamos cuidar de você?</h2>
                        <div className="deposit-notice">
                          <strong>Sinal de confiança de 25%</strong>
                          <p>
                            Para confirmar a reserva, pague 25% do valor do serviço. Esse
                            adiantamento será descontado do total; o restante é pago no atendimento.
                          </p>
                        </div>
                        <div className="services">
                          {data.services.map((s) => (
                            <button
                              key={s.id}
                              disabled={!s.active}
                              className={'service ' + (service === s.id ? 'selected' : '')}
                              onClick={() => {
                                setService(s.id);
                                if (s.sunday) setDay(nextSunday(localDay()));
                                else if (!day) setDay(localDay());
                              }}
                            >
                              <div className="serviceicon">
                                {s.id === 'corte' ? '✂' : s.id === 'combo' ? '✧' : '♔'}
                              </div>
                              <div>
                                <h3>{s.name}</h3>
                                <p>
                                  {s.minutes} minutos {s.sunday ? '· aos domingos' : ''}
                                </p>
                                {!s.active && <small>A definir com o barbeiro</small>}
                              </div>
                              <div className="service-pricing">
                                <strong>{formatMoney(s.price)}</strong>
                                <span>
                                  Sinal de 25%<b>{formatMoney(deposit(s.price))}</b>
                                </span>
                              </div>
                              <span className="radio" />
                            </button>
                          ))}
                        </div>
                        <div className="formfooter">
                          <span>Combine o pagamento do sinal com o barbeiro.</span>
                          <button
                            className="primary"
                            disabled={!selected?.active}
                            onClick={() => setStep(2)}
                          >
                            Escolher horário →
                          </button>
                        </div>
                      </>
                    )}
                    {step === 2 && (
                      <>
                        <p className="eyebrow">02 / ENCONTRE SEU HORÁRIO</p>
                        <h2>Qual é o melhor dia?</h2>
                        {selected?.sunday ? (
                          <SundayPicker
                            day={day}
                            onChange={setDay}
                            min={localDay()}
                            max={localDay(new Date(Date.now() + 90 * 86400000))}
                          />
                        ) : (
                          <label>
                            Data do atendimento{' '}
                            <span className="required-star" aria-hidden="true">
                              *
                            </span>
                            <input
                              type="date"
                              value={day}
                              min={localDay()}
                              max={localDay(new Date(Date.now() + 90 * 86400000))}
                              onInput={(e) => setDay(e.currentTarget.value)}
                              required
                            />
                            <small className="field-error">
                              Preencha este campo com um valor válido.
                            </small>
                          </label>
                        )}
                        <p className="muted">
                          Horários de Brasília · antecedência mínima de 2 horas.
                        </p>
                        <div className="slots">
                          {slots.map((s) => (
                            <button
                              className={chosen === s.time ? 'selected' : ''}
                              disabled={s.urgent && !data.user.admin}
                              title={
                                s.urgent
                                  ? 'Vaga liberada: reserva com o barbeiro e sinal imediato'
                                  : ''
                              }
                              key={s.time}
                              onClick={() => setChosen(s.time)}
                            >
                              {s.time}
                              {s.urgent && <small>Com o barbeiro</small>}
                            </button>
                          ))}
                        </div>
                        {loadingSlots ? (
                          <p role="status">Consultando horários…</p>
                        ) : (
                          !slots.length && (
                            <div className="empty">
                              {day
                                ? 'Nenhum horário para este serviço nesta data. Tente outro dia.'
                                : 'Selecione um domingo para consultar os horários.'}
                            </div>
                          )
                        )}
                        <div className="formfooter">
                          <button className="ghost" onClick={() => setStep(1)}>
                            ← Voltar
                          </button>
                          <button
                            className="primary"
                            disabled={!chosen || loadingSlots}
                            onClick={() => setStep(3)}
                          >
                            Continuar →
                          </button>
                        </div>
                      </>
                    )}
                    {step === 3 && (
                      <ValidatedForm
                        onSubmit={(e) => {
                          e.preventDefault();
                          setStep(4);
                        }}
                      >
                        <p className="eyebrow">03 / SEUS DADOS</p>
                        <h2>Fale mais sobre você</h2>
                        <p className="required-note">
                          Os campos com <span className="required-star">*</span> são obrigatórios.
                        </p>
                        <div className="fields">
                          <label>
                            Nome completo{' '}
                            <span className="required-star" aria-hidden="true">
                              *
                            </span>
                            <input
                              autoComplete="name"
                              required
                              minLength={5}
                              maxLength={100}
                              pattern="\S+\s+.+"
                              value={form.name}
                              onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                            <small className="field-error">
                              Preencha este campo com um valor válido.
                            </small>
                          </label>
                          <label>
                            Celular com DDD{' '}
                            <span className="required-star" aria-hidden="true">
                              *
                            </span>
                            <input
                              autoComplete="tel"
                              type="tel"
                              required
                              pattern="(?:[0-9]|\s|\+|\(|\)|-|\.){10,20}"
                              minLength={10}
                              maxLength={20}
                              value={form.phone}
                              onChange={(e) => setForm({ ...form, phone: e.target.value })}
                              placeholder="(14) 99999-9999"
                            />
                            <small className="field-error">
                              Preencha este campo com um valor válido.
                            </small>
                          </label>
                          <label>
                            Data de nascimento{' '}
                            <span className="required-star" aria-hidden="true">
                              *
                            </span>
                            <input
                              type="date"
                              required
                              min="1900-01-01"
                              max={localDay()}
                              value={form.birth}
                              onInput={(e) => setForm({ ...form, birth: e.currentTarget.value })}
                            />
                            <small className="field-error">
                              Preencha este campo com um valor válido.
                            </small>
                          </label>
                          <label>
                            E-mail <span className="muted">(opcional)</span>
                            <input
                              type="email"
                              autoComplete="email"
                              maxLength={150}
                              value={form.email}
                              onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                          </label>
                        </div>
                        <p className="privacy">
                          Seus dados identificam seus atendimentos. Somente você e a administração
                          têm acesso.
                        </p>
                        <div className="formfooter">
                          <button type="button" className="ghost" onClick={() => setStep(2)}>
                            ← Voltar
                          </button>
                          <button className="primary">Revisar reserva →</button>
                        </div>
                      </ValidatedForm>
                    )}
                    {step === 4 && selected && (
                      <>
                        <p className="eyebrow">04 / TUDO CERTO?</p>
                        <h2>Seu próximo horário.</h2>
                        <div className="review">
                          {[
                            ['Serviço', selected.name],
                            ['Quando', day.split('-').reverse().join('/') + ' às ' + chosen],
                            ['Cliente', form.name],
                            ['Valor total', formatMoney(selected.price)],
                            ['Sinal de 25%', formatMoney(deposit(selected.price))],
                            [
                              'Restante no atendimento',
                              formatMoney(selected.price - deposit(selected.price)),
                            ],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <span>{label}</span>
                              <strong>{value}</strong>
                            </div>
                          ))}
                        </div>
                        <div className="callout">
                          <strong>A reserva aguarda confirmação do sinal.</strong>
                          <p>
                            Combine o pagamento com o barbeiro e peça a confirmação até 2 horas
                            antes do atendimento. Sem confirmação, o horário é liberado. Não há
                            cobrança automática nesta página.
                          </p>
                        </div>
                        {slots.find((s) => s.time === chosen)?.urgent && (
                          <p className="privacy">
                            Reserva de última hora: ao finalizar como administrador, você declara
                            que recebeu o sinal e pode atender.
                          </p>
                        )}
                        {!chosen && (
                          <p role="alert" className="alert error">
                            O horário escolhido não está mais disponível. Volte e escolha outro
                            horário.
                          </p>
                        )}
                        <div className="formfooter">
                          <button className="ghost" onClick={() => setStep(3)}>
                            ← Voltar
                          </button>
                          <button
                            className="primary"
                            disabled={busy || loadingSlots || !chosen}
                            onClick={async () => {
                              if (
                                await handleAction({
                                  action: 'book',
                                  service,
                                  day,
                                  time: chosen,
                                  ...form,
                                })
                              ) {
                                setStep(1);
                                setChosen('');
                                setView('mine');
                              }
                            }}
                          >
                            {busy ? 'Reservando…' : 'Solicitar agendamento ✓'}
                          </button>
                        </div>
                      </>
                    )}
                  </section>
                  <section className="reservationaside">
                    <PromoCard
                      services={data.services}
                      choose={(id) => {
                        setService(id);
                        if (data.services.find((s) => s.id === id)?.sunday)
                          setDay(nextSunday(localDay()));
                        else if (!day) setDay(localDay());
                        setChosen('');
                        setStep(1);
                      }}
                    />
                    <div className="rules">
                      <h3>Antes de agendar</h3>
                      <p>
                        <b>01</b> Reserve com 2 horas de antecedência.
                      </p>
                      <p>
                        <b>02</b> Confirme 25% do valor com o barbeiro.
                      </p>
                      <p>
                        <b>03</b> Acompanhe a confirmação na sua agenda.
                      </p>
                    </div>
                  </section>
                </div>
              </>
            )}
            {view === 'mine' && (
              <>
                <div className="sectionheading">
                  <div>
                    <p className="eyebrow">SUA CONTA</p>
                    <h1>
                      Meus agendamentos<span>.</span>
                    </h1>
                  </div>
                  <button className="primary" onClick={() => setView('reserve')}>
                    ＋ Novo agendamento
                  </button>
                </div>
                <section className="panel list">
                  {mine.length ? (
                    mine.map((b) => renderBooking(b))
                  ) : (
                    <div className="empty">
                      <h2>Sua próxima visita começa aqui.</h2>
                      <p>Você ainda não tem agendamentos.</p>
                      <button onClick={() => setView('reserve')}>Encontrar um horário →</button>
                    </div>
                  )}
                </section>
              </>
            )}
            {view === 'agenda' && data.user.admin && (
              <>
                <div className="sectionheading">
                  <div>
                    <p className="eyebrow">PAINEL DO BARBEIRO</p>
                    <h1>Agenda de atendimentos</h1>
                  </div>
                  <label>
                    Data
                    <input
                      type="date"
                      value={filter}
                      onInput={(e) => setFilter(e.currentTarget.value)}
                    />
                  </label>
                </div>
                <div className="stats">
                  {[
                    [
                      'AGENDAMENTOS ATIVOS',
                      today.filter((b) => ['pending', 'confirmed'].includes(b.status)).length,
                    ],
                    ['AGUARDANDO SINAL', today.filter((b) => b.status === 'pending').length],
                    ['CONFIRMADOS', today.filter((b) => b.status === 'confirmed').length],
                    ['CONCLUÍDOS', today.filter((b) => b.status === 'completed').length],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <small>{label}</small>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
                <WeeklyCalendar
                  bookings={data.bookings}
                  day={filter}
                  selectDay={setFilter}
                  sundayOpen={Boolean(data.services.find((s) => s.id === 'noivo')?.active)}
                />
                <section className="panel list">
                  <div className="paneltitle">
                    <h2>Atendimentos do dia</h2>
                    <button className="ghost" onClick={loadData}>
                      ↻ Atualizar
                    </button>
                  </div>
                  {today.length ? (
                    today
                      .slice()
                      .reverse()
                      .map((b) => renderBooking(b, true))
                  ) : (
                    <div className="empty">Sua agenda está livre neste dia.</div>
                  )}
                </section>
                <p className="privacy">
                  Confirme o sinal após verificar o recebimento. Conclusão e falta ficam disponíveis
                  no início do atendimento. Cancelamentos não fazem reembolso automático.
                </p>
              </>
            )}
            {view === 'finance' && data.user.admin && (
              <>
                <div className="sectionheading">
                  <div>
                    <p className="eyebrow">VISÃO DO NEGÓCIO</p>
                    <h1>
                      Tempo que dá resultado<span>.</span>
                    </h1>
                  </div>
                  <div className="datefilters">
                    <label>
                      De
                      <input
                        type="date"
                        value={from}
                        max={to}
                        onInput={(e) => setFrom(e.currentTarget.value)}
                      />
                    </label>
                    <label>
                      Até
                      <input
                        type="date"
                        value={to}
                        min={from}
                        onInput={(e) => setTo(e.currentTarget.value)}
                      />
                    </label>
                  </div>
                </div>
                {range.valid ? (
                  <>
                    <FinanceChart bookings={period} expenses={costs} from={from} to={to} />
                    <div className="stats finance-stats">
                      {[
                        ['FATURAMENTO REALIZADO', summary.revenue],
                        ['DESPESAS REGISTRADAS', summary.cost],
                        ['LUCRO ESTIMADO', summary.profit],
                        ['MÉDIA POR DIA CORRIDO', summary.daily],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <small>{label}</small>
                          <strong>{formatMoney(Number(value))}</strong>
                        </div>
                      ))}
                    </div>
                    <p className="muted">
                      Receita reconhecida ao concluir o serviço, sem duplicar o sinal. Lucro depende
                      do registro de todas as despesas.
                    </p>
                    <div className="two">
                      <section className="panel">
                        <h2>Registrar despesa</h2>
                        <ValidatedForm
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (
                              await handleAction({
                                action: 'expense',
                                day: expense.day,
                                description: expense.description,
                                amount: Math.round(Number(expense.value) * 100),
                              })
                            )
                              setExpense({ ...expense, description: '', value: '' });
                          }}
                        >
                          <div className="fields">
                            <label>
                              Data{' '}
                              <span className="required-star" aria-hidden="true">
                                *
                              </span>
                              <input
                                type="date"
                                required
                                value={expense.day}
                                onInput={(e) =>
                                  setExpense({ ...expense, day: e.currentTarget.value })
                                }
                              />
                              <small className="field-error">
                                Preencha este campo com um valor válido.
                              </small>
                            </label>
                            <label>
                              Valor (R$){' '}
                              <span className="required-star" aria-hidden="true">
                                *
                              </span>
                              <input
                                type="number"
                                required
                                min="0.01"
                                max="1000000"
                                step="0.01"
                                value={expense.value}
                                onChange={(e) => setExpense({ ...expense, value: e.target.value })}
                              />
                              <small className="field-error">
                                Preencha este campo com um valor válido.
                              </small>
                            </label>
                          </div>
                          <label>
                            Descrição{' '}
                            <span className="required-star" aria-hidden="true">
                              *
                            </span>
                            <input
                              required
                              minLength={3}
                              maxLength={180}
                              value={expense.description}
                              onChange={(e) =>
                                setExpense({ ...expense, description: e.target.value })
                              }
                            />
                            <small className="field-error">
                              Preencha este campo com um valor válido.
                            </small>
                          </label>
                          <button className="primary" disabled={busy}>
                            Registrar despesa
                          </button>
                        </ValidatedForm>
                      </section>
                      <section className="panel">
                        <h2>Movimento na semana</h2>
                        <p className="muted">
                          Reservas confirmadas ou concluídas no período. Inclui dias sem movimento.
                        </p>
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label, i) => {
                          const n = period.filter(
                            (b) =>
                              ['confirmed', 'completed'].includes(b.status) &&
                              new Date(b.start).getUTCDay() === i
                          ).length;
                          return (
                            <div className="barrow" key={label}>
                              <span>{label}</span>
                              <div>
                                <i style={{ width: `${Math.min(100, n * 10)}%` }} />
                              </div>
                              <strong>{n}</strong>
                            </div>
                          );
                        })}
                      </section>
                    </div>
                    <section className="panel">
                      <h2>Despesas no período</h2>
                      {costs.length ? (
                        costs.map((e) => (
                          <div className="expense" key={e.id}>
                            <span>{e.day.split('-').reverse().join('/')}</span>
                            <strong>{e.description}</strong>
                            <span>{formatMoney(e.amount)}</span>
                            <button
                              className="expense-delete"
                              disabled={busy}
                              onClick={() => {
                                if (
                                  confirm(
                                    `Excluir a despesa “${e.description}” de ${formatMoney(e.amount)}? Ela sairá dos totais e poderá ser restaurada.`
                                  )
                                )
                                  handleAction({ action: 'deleteExpense', id: e.id });
                              }}
                            >
                              Excluir
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="empty">Nenhuma despesa registrada.</div>
                      )}
                    </section>
                    <section className="panel expense-archive">
                      <details>
                        <summary>Despesas excluídas ({data.deletedExpenses?.length || 0})</summary>
                        <p className="muted">
                          Estes lançamentos não entram nos totais. Restaure se precisar corrigir uma
                          exclusão.
                        </p>
                        {data.deletedExpenses?.map((e) => (
                          <div className="expense" key={e.id}>
                            <span>{e.day.split('-').reverse().join('/')}</span>
                            <strong>{e.description}</strong>
                            <span>{formatMoney(e.amount)}</span>
                            <button
                              className="ghost"
                              disabled={busy}
                              onClick={() => handleAction({ action: 'restoreExpense', id: e.id })}
                            >
                              Restaurar
                            </button>
                          </div>
                        ))}
                      </details>
                    </section>
                    <section className="panel">
                      <h2>Movimento por horário de início</h2>
                      <p className="muted">
                        Use os períodos com menos reservas para planejar compras.
                      </p>
                      <div className="hourgrid">
                        {Array.from(
                          { length: 26 },
                          (_, i) =>
                            `${String(7 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`
                        ).map((t) => (
                          <div key={t}>
                            <span>{t}</span>
                            <strong>
                              {
                                period.filter(
                                  (b) =>
                                    ['confirmed', 'completed'].includes(b.status) &&
                                    formatBookingTime(b.start) === t
                                ).length
                              }
                            </strong>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                ) : (
                  <div role="alert" className="alert error">
                    {range.error}
                  </div>
                )}
              </>
            )}
            {view === 'settings' && data.user.admin && (
              <>
                <p className="eyebrow">CONFIGURAÇÕES</p>
                <h1>
                  Serviços e preços<span>.</span>
                </h1>
                <p className="muted">
                  Gerencie os preços e a disponibilidade dos serviços. Dia do Noivo está disponível
                  exclusivamente aos domingos.
                </p>
                <div className="settingsgrid">
                  {data.services.map((s) => (
                    <ServiceForm
                      key={s.id + ':' + s.price + ':' + s.minutes + ':' + s.active}
                      service={s}
                      busy={busy}
                      save={handleAction}
                    />
                  ))}
                </div>
                <div className="callout">
                  <strong>Como funciona a confirmação</strong>
                  <p>
                    O sinal de 25% é confirmado manualmente na agenda. Vagas liberadas a menos de 2
                    horas podem ser reservadas pelo administrador com sinal imediato. Combine o
                    pagamento diretamente com o cliente e confirme somente após verificar o
                    recebimento.
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
