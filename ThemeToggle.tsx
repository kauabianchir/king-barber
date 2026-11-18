import { useState, useEffect } from 'react';
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.dataset.theme === 'dark');
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    try {
      localStorage.setItem('king-barber-theme', next ? 'dark' : 'light');
    } catch {}
  }
  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? 'Ativar modo claro' : 'Ativar modo noturno'}
    >
      <span aria-hidden="true">{dark ? '☀' : '☾'}</span>
      {dark ? 'Modo claro' : 'Modo noturno'}
    </button>
  );
}
