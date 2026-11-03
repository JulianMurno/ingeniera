'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Close, Leaf, Menu } from './icons';
import ThemeToggle from './ThemeToggle';

export default function PublicHeader({ content }) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButton.current?.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="ml-header">
      <div className="ml-header-inner">
        <a href="#inicio" className="ml-brand" aria-label={`${content.brand.name}, ir al inicio`}>
          <span className="ml-brand-mark" aria-hidden="true">
            <Leaf />
          </span>
          <span className="ml-brand-text">
            <span className="ml-brand-name">{content.brand.name}</span>
            <span className="ml-brand-note">{content.brand.note}</span>
          </span>
        </a>

        <nav className="ml-nav" aria-label="Secciones de la casa">
          {content.navigation.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-header-actions">
          <Link href={content.actions.book.href} className="ml-btn ml-btn-primary ml-btn-small">
            {content.actions.book.label}
            <ArrowRight />
          </Link>
          <Link href={content.actions.guest.href} className="ml-header-link">
            {content.actions.guest.label}
          </Link>
          <Link href={content.actions.staff.href} className="ml-header-link ml-header-link--quiet">
            {content.actions.staff.label}
          </Link>
          <ThemeToggle />
          <button
            ref={menuButton}
            type="button"
            className="ml-menu-button"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <Close /> : <Menu />}
          </button>
        </div>
      </div>

      <div className="ml-mobile-menu" id="menu-mobile" hidden={!open}>
        <nav aria-label="Menú móvil">
          {content.navigation.map((item) => (
            <a key={item.href} href={item.href} onClick={closeMenu}>
              {item.label}
            </a>
          ))}
          <div className="ml-mobile-actions">
            <Link
              href={content.actions.book.href}
              className="ml-btn ml-btn-primary"
              onClick={closeMenu}
            >
              {content.actions.book.label}
              <ArrowRight />
            </Link>
            <Link
              href={content.actions.guest.href}
              className="ml-btn ml-btn-ghost"
              onClick={closeMenu}
            >
              {content.actions.guest.label}
            </Link>
            <Link
              href={content.actions.staff.href}
              className="ml-btn ml-btn-ghost"
              onClick={closeMenu}
            >
              {content.actions.staff.label}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
