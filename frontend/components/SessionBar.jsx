'use client';

import { useState } from 'react';
import { login, logout, currentUser } from '@/lib/session';
import { setToken } from '@/lib/api';
import { Btn, ErrorMsg, Field, Input } from './ui';

export default function SessionBar() {
  const [user, setUser] = useState(() => currentUser());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tokenPaste, setTokenPaste] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onLogin(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const usr = await login(username, password);
      setUser(usr);
      setPassword('');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  function onUseToken() {
    setError(null);
    const token = tokenPaste.trim().replace(/^Bearer\s+/i, '');
    if (!token) {
      setError({ message: 'Ingresa un token' });
      return;
    }
    setToken(token);
    setUser({ rol: null });
    setTokenPaste('');
  }

  function onLogout() {
    logout();
    setUser(null);
  }

  if (user) {
    return (
      <div className="nav-user">
        <span className="muted">
          Sesión: {user.username || 'token copiado'}
          {user.rol === 'ADMINISTRADOR' ? ' (Admin)' : user.rol === 'RECEPCIONISTA' ? ' (Recepcionista)' : ''}
        </span>
        <Btn variant="ghost" size="sm" onClick={onLogout}>
          Salir
        </Btn>
      </div>
    );
  }

  return (
    <div className="nav-user">
      {error && <ErrorMsg error={error} />}
      <form className="inline-login" onSubmit={onLogin}>
        <Field label="Usuario">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </Field>
        <Field label="Contraseña">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Btn type="submit" variant="primary" disabled={busy}>
          Ingresar
        </Btn>
      </form>
      <Btn variant="ghost" size="sm" onClick={() => setShowToken((s) => !s)}>
        {showToken ? 'Ocultar token' : 'Usar token'}
      </Btn>
      {showToken && (
        <div className="inline-login">
          <Field label="Token (Bearer)">
            <Input
              value={tokenPaste}
              onChange={(e) => setTokenPaste(e.target.value)}
              placeholder="eyJhbGciOi…"
            />
          </Field>
          <Btn onClick={onUseToken}>Guardar</Btn>
        </div>
      )}
    </div>
  );
}