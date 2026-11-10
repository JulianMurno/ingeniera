'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import {
  Btn,
  Card,
  ErrorMsg,
  Field,
  Input,
  Loading,
  Msg,
  PageHeader,
  Pager,
  Table,
} from '@/components/ui';
import { useData } from '@/lib/useData';

const FORM_VACIO = { nombre: '', email: '', dni: '', telefono: '' };

export default function HuespedesPage() {
  const [filtros, setFiltros] = useState({ dni: '', nombre: '' });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const params = new URLSearchParams({ page, pageSize: 10 });
  if (filtros.dni) params.set('dni', filtros.dni);
  if (filtros.nombre) params.set('nombre', filtros.nombre);
  const { data, pagination, loading, error, reload } = useData(
    `/api/v1/guests?${params.toString()}`,
  );

  async function archivar(g) {
    if (!window.confirm(`Archivar al huésped ${g.nombre}? Conserva su historial.`)) return;
    try {
      await api(`/api/v1/guests/${g.id}`, { method: 'DELETE' });
      reload();
    } catch (e) {
      window.alert(e.message);
    }
  }

  return (
    <>
      <PageHeader
        title="Huéspedes"
        actions={
          <Btn
            variant="primary"
            onClick={() => {
              setCreating(true);
              setEditing(null);
            }}
          >
            + Nuevo huésped
          </Btn>
        }
      />

      <Card title="Filtros">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="DNI">
            <Input
              value={filtros.dni}
              onChange={(e) => {
                setFiltros((f) => ({ ...f, dni: e.target.value }));
                setPage(1);
              }}
            />
          </Field>
          <Field label="Nombre">
            <Input
              value={filtros.nombre}
              onChange={(e) => {
                setFiltros((f) => ({ ...f, nombre: e.target.value }));
                setPage(1);
              }}
            />
          </Field>
        </div>
      </Card>

      {creating && (
        <GuestForm
          title="Nuevo huésped"
          initial={FORM_VACIO}
          onSubmit={async (body) => api('/api/v1/guests', { method: 'POST', body })}
          onClose={() => {
            setCreating(false);
            reload();
          }}
        />
      )}
      {editing && (
        <GuestForm
          title={`Editar huésped #${editing.id}`}
          initial={editing}
          onSubmit={async (body) => api(`/api/v1/guests/${editing.id}`, { method: 'PATCH', body })}
          onClose={() => {
            setEditing(null);
            reload();
          }}
        />
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMsg error={error} />
      ) : (
        <Card title="Listado">
          <Table headers={['Nombre', 'DNI', 'Email', 'Teléfono', '']} empty="No hay huéspedes">
            {(data || []).map((g) => (
              <tr key={g.id}>
                <td>{g.nombre}</td>
                <td>{g.dni}</td>
                <td>{g.email}</td>
                <td>{g.telefono || '—'}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <Btn
                      size="sm"
                      onClick={() => {
                        setEditing(g);
                        setCreating(false);
                      }}
                    >
                      Editar
                    </Btn>
                    <Btn variant="danger" size="sm" onClick={() => archivar(g)}>
                      Archivar
                    </Btn>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pager pagination={pagination} onPage={setPage} />
        </Card>
      )}
    </>
  );
}

function GuestForm({ title, initial, onSubmit, onClose }) {
  const [form, setForm] = useState({
    nombre: initial.nombre || '',
    email: initial.email || '',
    dni: initial.dni || '',
    telefono: initial.telefono || '',
  });
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setOk('');
    setBusy(true);
    try {
      const body = { ...form };
      if (!body.telefono) delete body.telefono;
      await onSubmit(body);
      setOk('Guardado.');
      onClose();
    } catch (errApi) {
      setErr(errApi);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={title}>
      <ErrorMsg error={err} />
      <Msg>{ok}</Msg>
      <form onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre *">
            <Input value={form.nombre} onChange={set('nombre')} required />
          </Field>
          <Field label="DNI *">
            <Input value={form.dni} onChange={set('dni')} required />
          </Field>
          <Field label="Email *">
            <Input type="email" value={form.email} onChange={set('email')} required />
          </Field>
          <Field label="Teléfono">
            <Input value={form.telefono} onChange={set('telefono')} />
          </Field>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Btn type="submit" variant="primary" disabled={busy}>
            Guardar
          </Btn>
          <Btn type="button" onClick={onClose}>
            Cancelar
          </Btn>
        </div>
      </form>
    </Card>
  );
}
