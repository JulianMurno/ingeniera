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
      <div className="card">
        <ErrorMsg error={error} />
        <form onSubmit={onSubmit}>
          <Field label="Usuario">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </Field>
          <Field label="Contraseña">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <Btn type="submit" variant="primary" disabled={busy} style={{ width: '100%' }}>
            Ingresar
          </Btn>
        </form>
      </div>
      <p className="muted" style={{ textAlign: 'center', marginTop: 12 }}>
        Usuarios del seed: <code>admin</code> / <code>recepcionista</code> (123456)
      </p>
    </div>
  );
}