'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { getSessionUser } from '@/lib/api';
import Nav from './Nav';

const STAFF_PATHS = ['/limpieza', '/mantenimiento'];
const PUBLIC_APP_PATHS = ['/login', '/portal/login', '/portal/registro'];

const CONTAINER_CLASSES =
  'mx-auto w-full max-w-[1280px] px-3.5 pt-6 pb-12 [&>*+*]:mt-6 sm:px-4 lg:px-8';

function isStaffUser(user) {
  return user?.rol === 'ADMINISTRADOR' || user?.rol === 'RECEPCIONISTA';
}

function StaffRouteGuard({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getSessionUser();
    const isStaff = isStaffUser(user);
    setAuthorized(isStaff);
    setReady(true);

    if (!isStaff) {
      router.replace(user?.rol === 'HUESPED' ? '/portal' : '/login');
    }
  }, [router]);

  if (!ready) {
    return (
      <main className={CONTAINER_CLASSES}>
        <p className="text-[13px] text-muted" aria-live="polite">
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
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getSessionUser());
  }, [pathname]);

  if (pathname === '/') {
    return children;
  }

  const publicApp = PUBLIC_APP_PATHS.includes(pathname);
  const staffShell = isStaffUser(user) && !publicApp;

  const shell = staffShell ? (
    <div className="branded-shell min-h-screen lg:flex">
      <Nav user={user} onLogout={() => setUser(null)} />
      <div className="min-w-0 flex-1">
        <main className={CONTAINER_CLASSES}>{children}</main>
      </div>
    </div>
  ) : (
    <div className={publicApp ? undefined : 'branded-shell'}>
      <Nav user={user} onLogout={() => setUser(null)} />
      <main className={CONTAINER_CLASSES}>{children}</main>
    </div>
  );

  if (STAFF_PATHS.includes(pathname)) {
    return <StaffRouteGuard key={pathname}>{shell}</StaffRouteGuard>;
  }

  return shell;
}
