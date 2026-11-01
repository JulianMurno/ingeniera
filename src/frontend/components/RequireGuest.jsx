'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionUser } from '@/lib/api';

export default function RequireGuest({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getSessionUser();
    if (!user) {
      router.replace('/portal/login');
      return;
    }
    if (user.rol !== 'HUESPED') {
      router.replace('/');
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return <p className="muted">Cargando…</p>;
  return children;
}
