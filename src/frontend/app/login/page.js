'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setSession } from '@/lib/api';
import { Btn, ErrorMsg, Field, Input } from '@/components/ui';

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
      router.push('/');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <h1 className="login-title">Hotel Reservas</h1>
      <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Iniciar Sesión</h2>
          <p className="muted" style={{ margin: 0 }}>Acceda al panel de gestión</p>
        </div>
        <ErrorMsg error={error} />
        <form onSubmit={onSubmit}>
          <Field label="Usuario">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
              placeholder="Ingrese su usuario"
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
          <Btn type="submit" variant="primary" disabled={busy} style={{ width: '100%', marginTop: 8 }}>
            {busy ? 'Ingresando...' : 'Ingresar'}
          </Btn>
        </form>
      </div>
      <div style={{ textAlign: 'center', marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Usuarios de prueba: <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>admin</code> / <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>recepcionista</code> • Contraseña: <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>123456</code>
        </p>
      </div>
    </div>
  );
}