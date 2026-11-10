'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setSession } from '@/lib/api';
import { Btn, Card, ErrorMsg, Field, Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { token, user } = await api('/api/v1/auth/login', {
        method: 'POST',
        body: { username, password },
        auth: false,
      });
      setSession(token, user);
      router.push('/panel');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-12 w-full max-w-[440px] max-[720px]:mt-4">
      <h1 className="mb-6 text-center font-display text-[32px] font-bold tracking-[-0.01em]">
        Mirador del Sol
      </h1>
      <Card className="shadow-modal">
        <div className="mb-6 text-center">
          <h2 className="mb-2 font-display text-xl font-semibold">Iniciar Sesión</h2>
          <p className="m-0 text-[13px] text-muted">Acceda al panel de gestión</p>
        </div>
        <ErrorMsg error={error} />
        <form onSubmit={onSubmit}>
          <Field label="Usuario">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
              autoComplete="username"
              placeholder="Ingrese su usuario"
            />
          </Field>
          <Field label="Contraseña">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Ingrese su contraseña"
            />
          </Field>
          <Btn type="submit" variant="primary" disabled={busy} className="mt-2 w-full">
            {busy ? 'Ingresando...' : 'Ingresar'}
          </Btn>
        </form>
      </Card>
      <div className="mt-4 rounded-card border border-border bg-background-alt p-3 text-center">
        <p className="m-0 text-[13px] text-muted">
          Usuarios de prueba:{' '}
          <code className="rounded-[3px] bg-surface-strong px-1.5 py-0.5 font-mono text-xs">
            admin
          </code>{' '}
          /{' '}
          <code className="rounded-[3px] bg-surface-strong px-1.5 py-0.5 font-mono text-xs">
            recepcionista
          </code>{' '}
          • Contraseña:{' '}
          <code className="rounded-[3px] bg-surface-strong px-1.5 py-0.5 font-mono text-xs">
            123456
          </code>
        </p>
      </div>
    </div>
  );
}
