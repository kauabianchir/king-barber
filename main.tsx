import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Session } from '@supabase/supabase-js';
import App from './App';
import AuthPanel from './AuthPanel';
import Brand from './Brand';
import ThemeToggle from './ThemeToggle';
import { supabase } from './api';
import './styles.css';
function Root() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  if (session && !recovery) return <App key={session.user.id} />;
  return (
    <div className="auth-shell">
      <header className="auth-header">
        <Brand />
        <ThemeToggle />
      </header>
      {session === undefined ? (
        <section className="panel auth-panel">
          <h2>Preparando seu acesso…</h2>
        </section>
      ) : (
        <AuthPanel recovery={recovery} done={() => setRecovery(false)} />
      )}
    </div>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
