'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from './icons';

const STORAGE_KEY = 'mirador-theme';

function currentTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-landing-theme') === 'dark' ? 'dark' : 'light';
}

// `landing` usa las clases de landing.css; `app` usa tokens de Tailwind para el panel.
// En ambos casos el ícono visible lo decide el CSS según `data-landing-theme`,
// así no hay parpadeo antes de que el efecto lea el tema actual.
const VARIANTS = {
  landing: { button: 'ml-theme-toggle', sun: 'ml-icon-sun', moon: 'ml-icon-moon' },
  app: {
    button:
      'grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border border-border-strong bg-surface text-foreground-soft transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&_svg]:h-[18px] [&_svg]:w-[18px]',
    sun: 'block dark:hidden',
    moon: 'hidden dark:block',
  },
};

export default function ThemeToggle({ variant = 'landing' }) {
  const classes = VARIANTS[variant] ?? VARIANTS.landing;
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
      className={classes.button}
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'}
      aria-pressed={theme === 'dark'}
      title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
    >
      <Sun className={classes.sun} />
      <Moon className={classes.moon} />
    </button>
  );
}
