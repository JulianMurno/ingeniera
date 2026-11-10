'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { getSessionUser } from '@/lib/api';
import Nav from './Nav';

const STAFF_PATHS = ['/limpieza', '/mantenimiento'];
const PUBLIC_APP_PATHS = ['/login', '/portal/login', '/portal/registro'];

function StaffRouteGuard({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getSessionUser();
    const isStaff = user?.rol === 'ADMINISTRADOR' || user?.rol === 'RECEPCIONISTA';
    setAuthorized(isStaff);
    setReady(true);

    if (!isStaff) {
      router.replace(user?.rol === 'HUESPED' ? '/portal' : '/login');
    }
  }, [router]);

  if (!ready) {
    return (
      <main className="container">
        <p className="muted" aria-live="polite">
          Verificando acceso…
        </p>
      </main>
    );
  }
  if (!authorized) return null;

  return children;
}

export default function AppShell({ children }) {
  const pathname = usePathname();

  if (pathname === '/') {
    return children;
  }

  const shell = (
    <div className={PUBLIC_APP_PATHS.includes(pathname) ? undefined : 'branded-shell'}>
      <Nav />
      <main className="container">{children}</main>
    </div>
  );

  if (STAFF_PATHS.includes(pathname)) {
    return <StaffRouteGuard key={pathname}>{shell}</StaffRouteGuard>;
  }

  return shell;
}
