'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, clearSession, getSessionUser, isAdmin } from '@/lib/api';

const LINKS = [
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

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getSessionUser();
  const admin = isAdmin();
  const links = LINKS.filter((l) => !l.admin || admin);

  async function logout() {
    try {
      await api('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      /* la sesión se limpia igual */
    }
    clearSession();
    router.push('/login');
  }

  if (!user) {
    return (
      <header className="topbar">
        <div className="container topbar-inner">
          <Link href="/login" className="brand">
            Hotel Reservas
          </Link>
          {pathname !== '/login' && (
            <Link href="/login" className="btn btn-ghost">
              Iniciar sesión
            </Link>
          )}
        </div>
      </header>
    );
  }

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
              className={`nav-link ${pathname === l.href ? 'active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-user">
          <span className="muted">
            {user.username} · {user.rol === 'ADMINISTRADOR' ? 'Admin' : 'Recepcionista'}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}