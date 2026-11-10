'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, clearSession, getSessionUser } from '@/lib/api';
import { Leaf } from '@/components/landing/icons';
import { Btn } from '@/components/ui';

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

const TOPBAR_CLASSES =
  'sticky top-0 z-50 border-b border-border bg-topbar shadow-card backdrop-blur-md';
const TOPBAR_INNER_CLASSES =
  'mx-auto flex min-h-16 w-full max-w-[1280px] items-center gap-8 px-4 pt-6 pb-12 max-[900px]:flex-wrap max-[900px]:gap-x-5 max-[900px]:gap-y-3 max-[900px]:pt-3 max-[900px]:pb-3';
const BRAND_CLASSES = 'flex items-center gap-[11px] whitespace-nowrap text-primary no-underline';
const BRAND_MARK_CLASSES =
  'grid h-[38px] w-[38px] place-items-center rounded-full border border-border-strong bg-surface text-primary [&_svg]:h-5 [&_svg]:w-5';
const NAV_CLASSES =
  'flex flex-1 flex-wrap gap-1 max-[900px]:order-3 max-[900px]:basis-full max-[900px]:flex-nowrap max-[900px]:overflow-x-auto max-[900px]:pb-0.5';
const NAV_USER_CLASSES =
  'ml-auto flex items-center gap-3 rounded-pill border border-border bg-surface py-1.5 pr-2 pl-3.5 max-[540px]:border-0 max-[540px]:bg-transparent max-[540px]:p-0';
const USER_INFO_CLASSES = 'flex flex-col items-end gap-0.5 max-[540px]:hidden';

function navLinkClasses(active) {
  return [
    'whitespace-nowrap rounded-pill px-3 py-2 text-sm font-medium no-underline transition-colors',
    active
      ? 'bg-primary text-primary-contrast shadow-card'
      : 'text-foreground-soft hover:bg-primary-soft hover:text-primary-dark',
  ].join(' ');
}

function Brand({ href }) {
  return (
    <Link href={href} className={BRAND_CLASSES}>
      <span className={BRAND_MARK_CLASSES} aria-hidden="true">
        <Leaf />
      </span>
      <span className="flex flex-col leading-[1.05]">
        <span className="font-display text-[19px] tracking-[-0.015em]">Mirador del Sol</span>
        <span className="mt-[5px] text-[10px] font-medium tracking-[0.02em] text-muted">
          Sierras de Córdoba · Argentina
        </span>
      </span>
    </Link>
  );
}

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
      <header className={TOPBAR_CLASSES}>
        <div className={TOPBAR_INNER_CLASSES}>
          <Brand href={onPortal ? '/portal/login' : '/login'} />
          <nav className={NAV_CLASSES}>
            <Link href="/portal/login" className={navLinkClasses(onPortal)}>
              Portal de huéspedes
            </Link>
            <Link href="/login" className={navLinkClasses(!onPortal)}>
              Acceso personal
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  if (guest) {
    return (
      <header className={TOPBAR_CLASSES}>
        <div className={TOPBAR_INNER_CLASSES}>
          <Brand href="/portal" />
          <nav className={NAV_CLASSES}>
            {GUEST_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={navLinkClasses(isActive(l.href))}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className={NAV_USER_CLASSES}>
            <div className={USER_INFO_CLASSES}>
              <span className="text-[13px] font-semibold">{user.nombre || user.username}</span>
              <span className="text-[11px] text-muted">Huésped</span>
            </div>
            <Btn type="button" variant="ghost" size="sm" onClick={logout}>
              Cerrar sesión
            </Btn>
          </div>
        </div>
      </header>
    );
  }

  const links = STAFF_LINKS.filter((l) => !l.admin || admin);

  return (
    <header className={TOPBAR_CLASSES}>
      <div className={TOPBAR_INNER_CLASSES}>
        <Brand href="/panel" />
        <nav className={NAV_CLASSES}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={navLinkClasses(isActive(l.href))}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className={NAV_USER_CLASSES}>
          <div className={USER_INFO_CLASSES}>
            <span className="text-[13px] font-semibold">{user.username}</span>
            <span className="text-[11px] text-muted">
              {user.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Recepcionista'}
            </span>
          </div>
          <Btn type="button" variant="ghost" size="sm" onClick={logout}>
            Cerrar sesión
          </Btn>
        </div>
      </div>
    </header>
  );
}
