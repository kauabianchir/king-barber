import type { FormEvent } from 'react';
import { useState } from 'react';
import ValidatedForm from './ValidatedForm';
import { supabase } from './api';
export default function AuthPanel({
  recovery = false,
  done,
}: {
  recovery?: boolean;
  done?: () => void;
}) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const redirect = new URL('./', window.location.href).href;
  const star = (
    <span className="required-star" aria-hidden="true">
      *
    </span>
  );
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (recovery) {
        if (password !== repeat) throw Error('As senhas precisam ser iguais.');
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage('Senha atualizada.');
        done?.();
      } else if (mode === 'signup') {
        if (password !== repeat) throw Error('As senhas precisam ser iguais.');
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirect, data: { full_name: name.trim() } },
        });
        if (error) throw error;
        setMessage(
          'Conta solicitada. Confira seu e-mail para confirmar o cadastro e depois entre na sua conta.'
        );
        setPassword('');
        setRepeat('');
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirect,
        });
        if (error) throw error;
        setMessage(
          'Se houver uma conta com esse e-mail, você receberá as instruções de recuperação.'
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      const messages: Record<string, string> = {
        'Invalid login credentials': 'E-mail ou senha incorretos.',
        'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
        'Email rate limit exceeded': 'Aguarde alguns minutos antes de solicitar outro e-mail.',
        'User already registered':
          'Já existe uma conta com esse e-mail. Entre ou recupere sua senha.',
      };
      const message = error instanceof Error ? error.message : '';
      setError(messages[message] || message || 'Não foi possível concluir. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }
  let title = 'Bom ter você por aqui.';
  let description = 'Entre para agendar seu horário e cuidar do seu estilo.';
  if (recovery) {
    title = 'Defina sua nova senha';
    description = 'Escolha uma senha com pelo menos 12 caracteres.';
  } else if (mode === 'signup') {
    title = 'Seu próximo corte começa aqui.';
    description = 'Crie sua conta para reservar e acompanhar seus horários.';
  } else if (mode === 'reset') {
    title = 'Vamos recuperar seu acesso.';
    description = 'Enviaremos as instruções para o e-mail da sua conta.';
  }
  return (
    <section className="panel auth-panel">
      <p className="eyebrow">BEM-VINDO À KING BARBER</p>
      <h1>{title}</h1>
      <p className="muted">{description}</p>
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="alert success" role="status">
          {message}
        </div>
      )}
      <ValidatedForm onSubmit={handleSubmit}>
        {mode === 'signup' && !recovery && (
          <label>
            Nome completo {star}
            <input
              required
              autoComplete="name"
              minLength={5}
              maxLength={100}
              pattern="\S+\s+.+"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <small className="field-error">Informe seu nome completo.</small>
          </label>
        )}
        {!recovery && (
          <label>
            E-mail {star}
            <input
              type="email"
              required
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <small className="field-error">Informe um e-mail válido.</small>
          </label>
        )}
        {(mode !== 'reset' || recovery) && (
          <>
            <label>
              Senha {star}
              <input
                type={visible ? 'text' : 'password'}
                required
                minLength={mode === 'signup' || recovery ? 12 : 1}
                maxLength={128}
                autoComplete={mode === 'signup' || recovery ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <small className="field-error">
                {mode === 'signup' || recovery
                  ? 'Use pelo menos 12 caracteres.'
                  : 'Informe sua senha.'}
              </small>
            </label>
            {(mode === 'signup' || recovery) && (
              <label>
                Confirmar senha {star}
                <input
                  type={visible ? 'text' : 'password'}
                  required
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value)}
                />
                <small className="field-error">Repita a senha.</small>
              </label>
            )}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => setVisible(e.target.checked)}
              />{' '}
              Mostrar senha
            </label>
          </>
        )}
        <button className="primary" disabled={busy}>
          {busy
            ? 'Aguarde…'
            : recovery
              ? 'Salvar nova senha'
              : mode === 'signup'
                ? 'Criar minha conta'
                : mode === 'reset'
                  ? 'Enviar instruções'
                  : 'Entrar'}
        </button>
      </ValidatedForm>
      {!recovery && (
        <div className="auth-links">
          <button
            className="ghost"
            onClick={() => {
              setMode(mode === 'signup' ? 'login' : 'signup');
              setError('');
              setMessage('');
            }}
          >
            {mode === 'signup' ? 'Já tenho uma conta' : 'Criar uma conta'}
          </button>
          <button
            className="ghost"
            onClick={() => {
              setMode(mode === 'reset' ? 'login' : 'reset');
              setError('');
              setMessage('');
            }}
          >
            {mode === 'reset' ? 'Voltar para entrar' : 'Esqueci minha senha'}
          </button>
        </div>
      )}
    </section>
  );
}
