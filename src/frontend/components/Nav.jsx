'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, clearSession, getSessionUser } from '@/lib/api';
import { Leaf } from '@/components/landing/icons';

const STAFF_LINKS = [
  { href: '/panel', label: 'Panel' },
  { href: '/reservas', label: 'Reservas' },
  { href: '/huespedes', label: 'Huéspedes' },
  { href: '/habitaciones', label: 'Habitaciones' },
  { href: '/tarifas', label: 'Tarifas' },
  { href: '/disponibilidad', label: 'Disponibilidad' },
  { href: '/limpieza', label: 'Limpieza' },
  { href: '/mantenimiento', label: 'Mantenimiento' },
  { href: '/catalogo', label: 'Extras' },
  { href: '/consumo', label: 'Consumo' },
  { href: '/reportes', label: 'Reportes' },
  { href: '/usuarios', label: 'Usuarios', admin: true },
  { href: '/auditoria', label: 'Auditoría', admin: true },
  { href: '/salud', label: 'Salud' },
];

const GUEST_LINKS = [
  { href: '/portal', label: 'Inicio' },
  { href: '/portal/reservar', label: 'Reservar' },
  { href: '/portal/mis-reservas', label: 'Mis reservas' },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const guest = user?.rol === 'HUESPED';
  const admin = user?.rol === 'ADMINISTRADOR';

  useEffect(() => {
    setUser(getSessionUser());
  }, [pathname]);

  function isActive(href) {
    return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
  }

  async function logout() {
    try {
      await api('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      /* la sesión se limpia igual */
    }
    clearSession();
    setUser(null);
    router.push(guest ? '/portal/login' : '/login');
  }

  if (!user) {
    const onPortal = pathname.startsWith('/portal');
    return (
      <header className="topbar">
        <div className="container topbar-inner">
          <Link href={onPortal ? '/portal/login' : '/login'} className="brand">
            <span className="brand-mark" aria-hidden="true">
              <Leaf />
            </span>
            <span className="brand-copy">
              <span className="brand-name">Mirador del Sol</span>
              <span className="brand-note">Sierras de Córdoba · Argentina</span>
            </span>
          </Link>
          <nav className="nav">
            <Link href="/portal/login" className={`nav-link ${onPortal ? 'active' : ''}`}>
              Portal de huéspedes
            </Link>
            <Link href="/login" className={`nav-link ${!onPortal ? 'active' : ''}`}>
              Acceso personal
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  if (guest) {
    return (
      <header className="topbar">
        <div className="container topbar-inner">
          <Link href="/portal" className="brand">
            <span className="brand-mark" aria-hidden="true">
              <Leaf />
            </span>
            <span className="brand-copy">
              <span className="brand-name">Mirador del Sol</span>
              <span className="brand-note">Sierras de Córdoba · Argentina</span>
            </span>
          </Link>
          <nav className="nav">
            {GUEST_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link ${isActive(l.href) ? 'active' : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="nav-user">
            <div className="nav-user-info">
              <span className="nav-user-name">{user.nombre || user.username}</span>
              <span className="nav-user-role">
                Huésped
              </span>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
    );
  }

  const links = STAFF_LINKS.filter((l) => !l.admin || admin);

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link href="/panel" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Leaf />
          </span>
          <span className="brand-copy">
            <span className="brand-name">Mirador del Sol</span>
            <span className="brand-note">Sierras de Córdoba · Argentina</span>
          </span>
        </Link>
        <nav className="nav">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${isActive(l.href) ? 'active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-user">
          <div className="nav-user-info">
            <span className="nav-user-name">{user.username}</span>
            <span className="nav-user-role">
              {user.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Recepcionista'}
            </span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
