'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setSession } from '@/lib/api';
import { Btn, Card, ErrorMsg, Field, Input } from '@/components/ui';

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
    <div className="mx-auto mt-20 w-full max-w-[420px]">
      <h1 className="mb-8 text-center font-display text-[32px] font-extrabold tracking-[-0.01em] text-primary">
        Portal de Huéspedes
      </h1>
      <Card className="shadow-lg">
        <div className="mb-6 text-center">
          <h2 className="mb-2 font-display text-xl font-semibold">Crear cuenta</h2>
          <p className="m-0 text-[13px] text-muted">
            Regístrese para reservar y consultar sus reservas
          </p>
        </div>
        <ErrorMsg error={error} />
        <form onSubmit={onSubmit}>
          <Field label="Nombre completo">
            <Input
              value={form.nombre}
              onChange={update('nombre')}
              autoComplete="name"
              required
              autoFocus
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={update('email')}
              autoComplete="email"
              required
            />
          </Field>
          <Field label="DNI">
            <Input value={form.dni} onChange={update('dni')} required />
          </Field>
          <Field label="Teléfono (opcional)">
            <Input value={form.telefono} onChange={update('telefono')} autoComplete="tel" />
          </Field>
          <Field label="Contraseña (mínimo 8 caracteres)">
            <Input
              type="password"
              value={form.password}
              onChange={update('password')}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </Field>
          <Btn type="submit" variant="primary" disabled={busy} className="mt-2 w-full">
            {busy ? 'Creando cuenta...' : 'Crear cuenta'}
          </Btn>
        </form>
        <p className="mb-0 mt-4 text-center text-[13px] text-muted">
          ¿Ya tiene cuenta?{' '}
          <Link href="/portal/login" className="font-medium text-primary hover:underline">
            Inicie sesión
          </Link>
        </p>
      </Card>
    </div>
  );
}
