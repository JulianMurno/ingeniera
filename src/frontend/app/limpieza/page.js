'use client';

import { useState } from 'react';
import { api, isAdmin, todayISO } from '@/lib/api';
import {
  Badge,
  Btn,
  Card,
  ErrorMsg,
  Field,
  Input,
  Loading,
  Pager,
  Select,
  Table,
  fmtDate,
} from '@/components/ui';
import { useData } from '@/lib/useData';

const TIPOS = ['LIMPIEZA', 'LIMPIEZA_PROFUNDA', 'LINNERIA', 'INSPECCION'];
const ESTADOS = [
  'PENDIENTE',
  'EN_PROCESO',
  'LIMPIA',
  'EN_INSPECCION',
  'INSPECCION_OK',
  'INSPECCION_FALLA',
  'CANCELADA',
];

// Debe coincidir con src/lib/housekeepingState.js
const TRANSICIONES = {
  PENDIENTE: ['EN_PROCESO', 'CANCELADA'],
  EN_PROCESO: ['LIMPIA', 'CANCELADA'],
  LIMPIA: ['EN_INSPECCION', 'CANCELADA'],
  EN_INSPECCION: ['INSPECCION_OK', 'INSPECCION_FALLA'],
  INSPECCION_FALLA: ['EN_PROCESO'],
  INSPECCION_OK: [],
  CANCELADA: [],
};

export default function LimpiezaPage() {
  const admin = isAdmin();
  const [filtros, setFiltros] = useState({ estado: '', tipo: '', fecha: '' });
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [actionErr, setActionErr] = useState(null);

  const params = new URLSearchParams({ page, pageSize: 10 });
  Object.entries(filtros).forEach(([k, v]) => v && params.set(k, v));
  const { data, pagination, loading, error, reload } = useData(
    `/api/v1/housekeeping/tasks?${params.toString()}`,
  );
  const resumen = useData(
    `/api/v1/housekeeping/resumen${filtros.fecha ? `?fecha=${filtros.fecha}` : ''}`,
  );

  const setFiltro = (k) => (e) => {
    setFiltros((f) => ({ ...f, [k]: e.target.value }));
    setPage(1);
  };

  async function cambiarEstado(t, estado) {
    if (estado === 'CANCELADA' && !window.confirm(`Cancelar la tarea #${t.id}?`)) return;
    setActionErr(null);
    try {
      await api(`/api/v1/housekeeping/tasks/${t.id}`, { method: 'PATCH', body: { estado } });
      reload();
      resumen.reload();
    } catch (e) {
      setActionErr(e);
    }
  }

  return (
    <>
      <div className="spread">
        <h1>Limpieza</h1>
        {admin && (
          <Btn variant="primary" onClick={() => setCreating(true)}>
            + Programar tarea
          </Btn>
        )}
      </div>

      {creating && (
        <TaskForm
          onClose={() => {
            setCreating(false);
            reload();
            resumen.reload();
          }}
        />
      )}

      <Card title="Resumen por estado">
        {resumen.loading ? (
          <Loading />
        ) : resumen.error ? (
          <ErrorMsg error={resumen.error} />
        ) : (
          <div className="row">
            {(resumen.data?.porEstado || []).length === 0 && <p className="muted">Sin tareas</p>}
            {(resumen.data?.porEstado || []).map((r) => (
              <span key={r.estado}>
                <Badge kind={r.estado} /> {r._count}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card title="Filtros">
        <div className="row">
          <Field label="Estado">
            <Select value={filtros.estado} onChange={setFiltro('estado')}>
              <option value="">Todos</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo">
            <Select value={filtros.tipo} onChange={setFiltro('tipo')}>
              <option value="">Todos</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha programada">
            <Input type="date" value={filtros.fecha} onChange={setFiltro('fecha')} />
          </Field>
        </div>
      </Card>

      <ErrorMsg error={actionErr} />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMsg error={error} />
      ) : (
        <Card title="Tareas">
          <Table
            headers={['#', 'Habitación', 'Tipo', 'Fecha', 'Responsable', 'Estado', 'Acciones']}
            empty="No hay tareas"
          >
            {(data || []).map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.room?.numero ?? t.roomId}</td>
                <td>{t.tipo}</td>
                <td>{fmtDate(t.fechaProgramada)}</td>
                <td>{t.asignadoA?.username || '—'}</td>
                <td>
                  <Badge kind={t.estado} />
                </td>
                <td className="row">
                  {(TRANSICIONES[t.estado] || [])
                    .filter((s) => s !== 'CANCELADA' || admin)
                    .map((s) => (
                      <Btn
                        key={s}
                        variant={s === 'CANCELADA' ? 'sm btn-danger' : 'sm'}
                        onClick={() => cambiarEstado(t, s)}
                      >
                        {s}
                      </Btn>
                    ))}
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

function TaskForm({ onClose }) {
  const rooms = useData('/api/v1/rooms?pageSize=100');
  const users = useData('/api/v1/users?pageSize=100');
  const [form, setForm] = useState({
    roomId: '',
    tipo: 'LIMPIEZA',
    fechaProgramada: todayISO(),
    asignadoAId: '',
    observaciones: '',
  });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const body = { ...form, roomId: Number(form.roomId) };
      if (body.asignadoAId) body.asignadoAId = Number(body.asignadoAId);
      else delete body.asignadoAId;
      if (!body.observaciones) delete body.observaciones;
      await api('/api/v1/housekeeping/tasks', { method: 'POST', body });
      onClose();
    } catch (errApi) {
      setErr(errApi);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Programar tarea">
      <ErrorMsg error={err || rooms.error || users.error} />
      <form onSubmit={submit}>
        <div className="grid grid-2">
          <Field label="Habitación *">
            <Select value={form.roomId} onChange={set('roomId')} required>
              <option value="">Elegir…</option>
              {(rooms.data || []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.numero} · {r.tipo}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo *">
            <Select value={form.tipo} onChange={set('tipo')}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha programada *">
            <Input type="date" value={form.fechaProgramada} onChange={set('fechaProgramada')} required />
          </Field>
          <Field label="Responsable">
            <Select value={form.asignadoAId} onChange={set('asignadoAId')}>
              <option value="">Sin asignar</option>
              {(users.data || []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Observaciones">
            <Input value={form.observaciones} onChange={set('observaciones')} />
          </Field>
        </div>
        <div className="row">
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
