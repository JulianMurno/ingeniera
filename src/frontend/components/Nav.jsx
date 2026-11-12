'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, clearSession } from '@/lib/api';
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

const SIDEBAR_CLASSES =
  'sticky top-0 z-40 hidden h-screen w-[260px] shrink-0 flex-col border-r border-border bg-surface px-3 py-5 lg:flex';
const SIDEBAR_NAV_CLASSES = 'mt-4 flex flex-1 flex-col gap-0.5 overflow-y-auto pb-2';
const SIDEBAR_LABEL_CLASSES =
  'mt-5 px-3 text-[10px] font-semibold tracking-[0.12em] text-muted uppercase';
const SIDEBAR_FOOTER_CLASSES = 'mt-2 border-t border-border pt-4';
const MOBILE_STAFF_HEADER_CLASSES =
  'sticky top-0 z-50 border-b border-border bg-topbar shadow-card backdrop-blur-md lg:hidden';

function navLinkClasses(active) {
  return [
    'whitespace-nowrap rounded-pill px-3 py-2 text-sm font-medium no-underline transition-colors',
    active
      ? 'bg-primary text-primary-contrast shadow-card'
      : 'text-foreground-soft hover:bg-primary-soft hover:text-primary-dark',
  ].join(' ');
}

function sidebarLinkClasses(active) {
  return [
    'flex items-center gap-2.5 rounded-control px-3 py-2 text-sm font-medium no-underline transition-colors',
    active
      ? 'bg-primary text-primary-contrast shadow-card'
      : 'text-foreground-soft hover:bg-primary-soft hover:text-primary-dark',
  ].join(' ');
}

function Brand({ href, compact = false }) {
  return (
    <Link href={href} className={BRAND_CLASSES}>
      <span className={BRAND_MARK_CLASSES} aria-hidden="true">
        <Leaf />
      </span>
      <span className="flex flex-col leading-[1.05]">
        <span className="font-display text-[19px] tracking-[-0.015em]">Mirador del Sol</span>
        {compact ? null : (
          <span className="mt-[5px] text-[10px] font-medium tracking-[0.02em] text-muted">
            Sierras de Córdoba · Argentina
          </span>
        )}
      </span>
    </Link>
  );
}

function RoleLabel({ role }) {
  return role === 'ADMINISTRADOR' ? 'Administrador' : 'Recepcionista';
}

export default function Nav({ user = null, onLogout }) {
  const pathname = usePathname();
  const router = useRouter();
  const guest = user?.rol === 'HUESPED';
  const admin = user?.rol === 'ADMINISTRADOR';

  function isActive(href) {
    return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
  }

  async function logout() {
    const wasGuest = guest;
    try {
      await api('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      /* la sesión se limpia igual */
    }
    clearSession();
    onLogout?.();
    router.push(wasGuest ? '/portal/login' : '/login');
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
  const initial = (user.username || '?').charAt(0).toUpperCase();

  return (
    <>
      <aside className={SIDEBAR_CLASSES}>
        <div className="px-2">
          <Brand href="/panel" compact />
        </div>
        <p className={SIDEBAR_LABEL_CLASSES}>Panel de gestión</p>
        <nav className={SIDEBAR_NAV_CLASSES} aria-label="Secciones del panel">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={sidebarLinkClasses(isActive(l.href))}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className={SIDEBAR_FOOTER_CLASSES}>
          <div className="flex items-center gap-2.5 px-1">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-[13px] font-semibold text-primary-dark"
              aria-hidden="true"
            >
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{user.username}</p>
              <p className="text-[11px] text-muted">
                <RoleLabel role={user.rol} />
              </p>
            </div>
          </div>
          <Btn
            type="button"
            variant="ghost"
            size="sm"
            onClick={logout}
            className="mt-2 w-full justify-start"
          >
            Cerrar sesión
          </Btn>
        </div>
      </aside>

      <header className={MOBILE_STAFF_HEADER_CLASSES}>
        <div className="flex items-center gap-3 px-4 py-3">
          <Brand href="/panel" compact />
          <Btn type="button" variant="ghost" size="sm" onClick={logout} className="ml-auto">
            Salir
          </Btn>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto px-4 pb-3"
          aria-label="Secciones del panel"
        >
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={navLinkClasses(isActive(l.href))}>
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
