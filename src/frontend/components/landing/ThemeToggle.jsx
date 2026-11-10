'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from './icons';

const STORAGE_KEY = 'mirador-theme';

function currentTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-landing-theme') === 'dark' ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    setTheme(currentTheme());
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-landing-theme', next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage bloqueado: el tema sigue aplicado en esta visita */
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      className="ml-theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'}
      aria-pressed={theme === 'dark'}
      title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
    >
      <Sun className="ml-icon-sun" />
      <Moon className="ml-icon-moon" />
    </button>
  );
}
