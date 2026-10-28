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
  Pager,
  Select,
  Table,
  fmtMoney,
  ROOM_TYPES,
} from '@/components/ui';
import { useData } from '@/lib/useData';

const FORM_VACIO = {
  numero: '',
  tipo: 'SINGLE',
  tarifa: '',
  capacidad: '1',
  estado: 'DISPONIBLE',
  descripcion: '',
  comodidades: '',
  fotos: '',
};

function toCreate(form) {
  return {
    numero: form.numero,
    tipo: form.tipo,
    tarifa: Number(form.tarifa),
    capacidad: Number(form.capacidad),
    estado: form.estado,
    descripcion: form.descripcion || undefined,
    comodidades: form.comodidades
      ? form.comodidades.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined,
    fotos: form.fotos ? form.fotos.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
  };
}

function fromRoom(r) {
  return {
    numero: r.numero,
    tipo: r.tipo,
    tarifa: String(r.tarifa),
    capacidad: String(r.capacidad),
    estado: r.estado,
    descripcion: r.descripcion || '',
    comodidades: (r.comodidades || []).join(', '),
    fotos: (r.fotos || []).join(', '),
  };
}

export default function HabitacionesPage() {
  const [filtros, setFiltros] = useState({ tipo: '', estado: '', tarifaMin: '', tarifaMax: '' });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const params = new URLSearchParams({ page, pageSize: 10 });
  Object.entries(filtros).forEach(([k, v]) => v && params.set(k, v));
  const { data, pagination, loading, error, reload } = useData(
    `/api/v1/rooms?${params.toString()}`,
  );

  async function toggleEstado(r) {
    const nuevo = r.estado === 'MANTENIMIENTO' ? 'DISPONIBLE' : 'MANTENIMIENTO';
    try {
      await api(`/api/v1/rooms/${r.id}`, { method: 'PATCH', body: { estado: nuevo } });
      reload();
    } catch (e) {
      window.alert(e.message);
    }
  }

  async function eliminar(r) {
    if (!window.confirm(`Eliminar la habitación ${r.numero}?`)) return;
    try {
      await api(`/api/v1/rooms/${r.id}`, { method: 'DELETE' });
      reload();
    } catch (e) {
      window.alert(e.message);
    }
  }

  return (
    <>
      <div className="spread">
        <h1>Habitaciones</h1>
        <Btn variant="primary" onClick={() => { setCreating(true); setEditing(null); }}>
          + Nueva habitación
        </Btn>
      </div>

      <Card title="Filtros">
        <div className="row">
          <Field label="Tipo">
            <Select
              value={filtros.tipo}
              onChange={(e) => { setFiltros((f) => ({ ...f, tipo: e.target.value })); setPage(1); }}
            >
              <option value="">Todos</option>
              {Object.values(ROOM_TYPES).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Estado">
            <Select
              value={filtros.estado}
              onChange={(e) => { setFiltros((f) => ({ ...f, estado: e.target.value })); setPage(1); }}
            >
              <option value="">Todos</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
            </Select>
          </Field>
          <Field label="Tarifa mínima">
            <Input
              type="number"
              value={filtros.tarifaMin}
              onChange={(e) => { setFiltros((f) => ({ ...f, tarifaMin: e.target.value })); setPage(1); }}
            />
          </Field>
          <Field label="Tarifa máxima">
            <Input
              type="number"
              value={filtros.tarifaMax}
              onChange={(e) => { setFiltros((f) => ({ ...f, tarifaMax: e.target.value })); setPage(1); }}
            />
          </Field>
        </div>
      </Card>

      {creating && (
        <RoomForm
          title="Nueva habitación"
          initial={FORM_VACIO}
          onSubmit={async (body) => api('/api/v1/rooms', { method: 'POST', body })}
          onClose={() => { setCreating(false); reload(); }}
        />
      )}
      {editing && (
        <RoomForm
          title={`Editar habitación #${editing.id}`}
          initial={fromRoom(editing)}
          onSubmit={async (body) => api(`/api/v1/rooms/${editing.id}`, { method: 'PATCH', body })}
          onClose={() => { setEditing(null); reload(); }}
        />
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMsg error={error} />
      ) : (
        <Card title="Listado">
          <Table
            headers={['Nº', 'Tipo', 'Capacidad', 'Tarifa/noche', 'Estado', '']}
            empty="No hay habitaciones"
          >
            {(data || []).map((r) => (
              <tr key={r.id}>
                <td>{r.numero}</td>
                <td>{r.tipo}</td>
                <td>{r.capacidad} pax</td>
                <td className="money">{fmtMoney(r.tarifa)}</td>
                <td><Badge kind={r.estado} /></td>
                <td className="spread">
                  <Btn variant="sm" onClick={() => { setEditing(r); setCreating(false); }}>
                    Editar
                  </Btn>
                  <Btn variant="sm" onClick={() => toggleEstado(r)}>
                    {r.estado === 'MANTENIMIENTO' ? 'Poner disponible' : 'A mantenimiento'}
                  </Btn>
                  <Btn variant="sm btn-danger" onClick={() => eliminar(r)}>
                    Eliminar
                  </Btn>
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

function RoomForm({ title, initial, onSubmit, onClose }) {
  const [form, setForm] = useState(initial);
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
      await onSubmit(toCreate(form));
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
        <div className="grid grid-2">
          <Field label="Número *">
            <Input value={form.numero} onChange={set('numero')} required />
          </Field>
          <Field label="Tipo *">
            <Select value={form.tipo} onChange={set('tipo')}>
              {Object.values(ROOM_TYPES).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Tarifa por noche *">
            <Input type="number" min="1" value={form.tarifa} onChange={set('tarifa')} required />
          </Field>
          <Field label="Capacidad *">
            <Input type="number" min="1" value={form.capacidad} onChange={set('capacidad')} required />
          </Field>
          <Field label="Estado">
            <Select value={form.estado} onChange={set('estado')}>
              <option value="DISPONIBLE">Disponible</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
            </Select>
          </Field>
          <Field label="Descripción">
            <Input value={form.descripcion} onChange={set('descripcion')} />
          </Field>
          <Field label="Comodidades (separadas por coma)">
            <Input value={form.comodidades} onChange={set('comodidades')} />
          </Field>
          <Field label="Fotos (URLs separadas por coma)">
            <Input value={form.fotos} onChange={set('fotos')} />
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