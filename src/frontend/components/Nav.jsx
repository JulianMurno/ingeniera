'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, clearSession, getSessionUser, isAdmin, isGuest } from '@/lib/api';

const STAFF_LINKS = [
  { href: '/', label: 'Panel' },
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
  const user = getSessionUser();
  const admin = isAdmin();
  const guest = isGuest();

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
    router.push(guest ? '/portal/login' : '/login');
  }

  if (!user) {
    const onPortal = pathname.startsWith('/portal');
    return (
      <header className="topbar">
        <div className="container topbar-inner">
          <Link href={onPortal ? '/portal/login' : '/login'} className="brand">
            Hotel Reservas
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
            Hotel Reservas
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
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}
            >
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {user.nombre || user.username}
              </span>
              <span className="muted" style={{ fontSize: 11 }}>
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
        <Link href="/" className="brand">
          Hotel Reservas
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{user.username}</span>
            <span className="muted" style={{ fontSize: 11 }}>
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
