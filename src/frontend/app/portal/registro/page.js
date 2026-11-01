'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setSession } from '@/lib/api';
import { Btn, ErrorMsg, Field, Input } from '@/components/ui';

const initialForm = {
  nombre: '',
  email: '',
  dni: '',
  telefono: '',
  password: '',
};

export default function GuestRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body = {
        nombre: form.nombre,
        email: form.email,
        dni: form.dni,
        password: form.password,
      };
      if (form.telefono.trim()) body.telefono = form.telefono.trim();

      const { token, user } = await api('/api/v1/auth/guest/register', {
        method: 'POST',
        body,
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
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Crear cuenta</h2>
          <p className="muted" style={{ margin: 0 }}>
            Regístrese para reservar y consultar sus reservas
          </p>
        </div>
        <ErrorMsg error={error} />
        <form onSubmit={onSubmit}>
          <Field label="Nombre completo">
            <Input value={form.nombre} onChange={update('nombre')} required autoFocus />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={update('email')} required />
          </Field>
          <Field label="DNI">
            <Input value={form.dni} onChange={update('dni')} required />
          </Field>
          <Field label="Teléfono (opcional)">
            <Input value={form.telefono} onChange={update('telefono')} />
          </Field>
          <Field label="Contraseña (mínimo 8 caracteres)">
            <Input
              type="password"
              value={form.password}
              onChange={update('password')}
              minLength={8}
              required
            />
          </Field>
          <Btn
            type="submit"
            variant="primary"
            disabled={busy}
            style={{ width: '100%', marginTop: 8 }}
          >
            {busy ? 'Creando cuenta...' : 'Crear cuenta'}
          </Btn>
        </form>
        <p className="muted" style={{ marginTop: 16, marginBottom: 0, textAlign: 'center' }}>
          ¿Ya tiene cuenta? <Link href="/portal/login">Inicie sesión</Link>
        </p>
      </div>
    </div>
  );
}
