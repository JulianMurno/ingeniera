'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setSession } from '@/lib/api';
import { Btn, Card, ErrorMsg, Field, Input } from '@/components/ui';

export default function GuestLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { token, user } = await api('/api/v1/auth/guest/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
      });
      setSession(token, user);
      router.push('/portal');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-20 w-full max-w-[420px]">
      <h1 className="mb-8 text-center font-display text-[32px] font-extrabold tracking-[-0.01em] text-primary">
        Mirador del Sol
      </h1>
      <Card className="shadow-lg">
        <div className="mb-6 text-center">
          <h2 className="mb-2 font-display text-xl font-semibold">Iniciar Sesión</h2>
          <p className="m-0 text-[13px] text-muted">
            Consulte disponibilidad y gestione sus reservas
          </p>
        </div>
        <ErrorMsg error={error} />
        <form onSubmit={onSubmit}>
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
              placeholder="su@email.com"
            />
          </Field>
          <Field label="Contraseña">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="Ingrese su contraseña"
            />
          </Field>
          <Btn type="submit" variant="primary" disabled={busy} className="mt-2 w-full">
            {busy ? 'Ingresando...' : 'Ingresar'}
          </Btn>
        </form>
        <p className="mb-0 mt-4 text-center text-[13px] text-muted">
          ¿No tiene cuenta?{' '}
          <Link href="/portal/registro" className="font-medium text-primary hover:underline">
            Regístrese
          </Link>
        </p>
      </Card>
      <p className="mt-4 text-center text-[13px] text-muted">
        ¿Es personal del hotel?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Acceso al panel de gestión
        </Link>
      </p>
    </div>
  );
}
