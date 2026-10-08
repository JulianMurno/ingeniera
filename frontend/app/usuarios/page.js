'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import {
  Badge,
  Btn,
  Card,
  ErrorMsg,
  Field,
  Input,
  Loading,
  Msg,
  Select,
  Table,
} from '@/components/ui';
import { useData } from '@/lib/useData';

export default function UsuariosPage() {
  const { data, loading, error, reload } = useData('/api/v1/users');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);

  async function deactivate(u) {
    if (u.activo) {
      if (!window.confirm(`Desactivar la cuenta ${u.username}?`)) return;
      await api(`/api/v1/users/${u.id}`, { method: 'DELETE' });
    } else {
      await api(`/api/v1/users/${u.id}`, { method: 'PATCH', body: { activo: true } });
    }
    reload();
  }

  return (
    <>
      <div className="spread">
        <h1>Usuarios del personal</h1>
        <Btn variant="primary" onClick={() => { setCreating(true); setEditing(null); }}>
          + Nuevo usuario
        </Btn>
      </div>

      {creating && (
        <UserForm
          title="Nuevo usuario"
          onSubmit={async (body) => api('/api/v1/users', { method: 'POST', body })}
          onClose={() => { setCreating(false); reload(); }}
        />
      )}
      {editing && (
        <UserForm
          title={`Editar usuario ${editing.username}`}
          initial={editing}
          onSubmit={async (body) => api(`/api/v1/users/${editing.id}`, { method: 'PATCH', body })}
          onClose={() => { setEditing(null); reload(); }}
        />
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMsg error={error} />
      ) : (
        <Card title="Listado (incluye desactivados)">
          <Table headers={['Usuario', 'Rol', 'Estado', '']} empty="Sin usuarios">
            {(data || []).map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.rol}</td>
                <td>{u.activo ? <Badge kind="ok">Activo</Badge> : <Badge kind="down">Desactivado</Badge>}</td>
                <td className="spread">
                  <Btn variant="sm" onClick={() => { setEditing(u); setCreating(false); }}>
                    Editar
                  </Btn>
                  <Btn variant="sm" onClick={() => deactivate(u)}>
                    {u.activo ? 'Desactivar' : 'Reactivar'}
                  </Btn>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </>
  );
}

function UserForm({ title, initial, onSubmit, onClose }) {
  const [form, setForm] = useState({
    username: initial?.username || '',
    rol: initial?.rol || 'RECEPCIONISTA',
    password: '',
  });
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  function submit(e) {
    e.preventDefault();
    setErr(null);
    setOk('');
    setBusy(true);
    const body = {
      username: form.username,
      rol: form.rol,
    };
    if (form.password) body.password = form.password;
    onSubmit(body)
      .then(() => {
        setOk('Guardado.');
        onClose();
      })
      .catch(setErr)
      .finally(() => setBusy(false));
  }

  return (
    <Card title={title}>
      <ErrorMsg error={err} />
      <Msg>{ok}</Msg>
      <form onSubmit={submit}>
        <div className="grid grid-2">
          <Field label="Usuario *">
            <Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required />
          </Field>
          <Field label="Rol *">
            <Select value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}>
              <option value="RECEPCIONISTA">Recepcionista</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </Select>
          </Field>
          <Field label={initial ? 'Contraseña (dejar vacío para no cambiarla)' : 'Contraseña *'}>
            <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required={!initial} minLength={6} />
          </Field>
        </div>
        <div className="row">
          <Btn type="submit" variant="primary" disabled={busy}>Guardar</Btn>
          <Btn onClick={onClose}>Cancelar</Btn>
        </div>
      </form>
    </Card>
  );
}