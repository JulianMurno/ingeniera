'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setSession } from '@/lib/api';
import { Btn, ErrorMsg, Field, Input } from '@/components/ui';

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
    <div className="login-wrap">
      <h1 className="login-title">Portal de Huéspedes</h1>
      <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Iniciar Sesión</h2>
          <p className="muted" style={{ margin: 0 }}>
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
              required
              placeholder="Ingrese su contraseña"
            />
          </Field>
          <Btn
            type="submit"
            variant="primary"
            disabled={busy}
            style={{ width: '100%', marginTop: 8 }}
          >
            {busy ? 'Ingresando...' : 'Ingresar'}
          </Btn>
        </form>
        <p className="muted" style={{ marginTop: 16, marginBottom: 0, textAlign: 'center' }}>
          ¿No tiene cuenta? <Link href="/portal/registro">Regístrese</Link>
        </p>
      </div>
      <p className="muted" style={{ marginTop: 16, textAlign: 'center', fontSize: 13 }}>
        ¿Es personal del hotel? <Link href="/login">Acceso al panel de gestión</Link>
      </p>
    </div>
  );
}
