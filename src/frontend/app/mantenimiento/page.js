'use client';

import { useState } from 'react';
import { api, isAdmin } from '@/lib/api';
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
  fmtDateTime,
} from '@/components/ui';
import { useData } from '@/lib/useData';

const TIPOS = ['FUGA', 'AVERIA', 'ELECTRICA', 'LIMPIEZA_REACTIVA', 'OTRO'];
const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];
const ESTADOS = ['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CANCELADO'];

// Debe coincidir con src/lib/maintenanceState.js
const TRANSICIONES = {
  ABIERTO: ['EN_PROCESO', 'RESUELTO', 'CANCELADO'],
  EN_PROCESO: ['RESUELTO', 'CANCELADO'],
  RESUELTO: [],
  CANCELADO: [],
};

export default function MantenimientoPage() {
  const admin = isAdmin();
  const [filtros, setFiltros] = useState({ estado: '', prioridad: '', tipo: '' });
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [actionErr, setActionErr] = useState(null);

  const params = new URLSearchParams({ page, pageSize: 10 });
  Object.entries(filtros).forEach(([k, v]) => v && params.set(k, v));
  const { data, pagination, loading, error, reload } = useData(
    `/api/v1/maintenance/tickets?${params.toString()}`,
  );

  const setFiltro = (k) => (e) => {
    setFiltros((f) => ({ ...f, [k]: e.target.value }));
    setPage(1);
  };

  async function cambiarEstado(t, estado) {
    const body = { estado };
    if (estado === 'RESUELTO') {
      const resolucion = window.prompt('Describí la resolución:');
      if (resolucion === null) return;
      if (resolucion) body.resolucion = resolucion;
    }
    if (estado === 'CANCELADO' && !window.confirm(`Cancelar el ticket #${t.id}?`)) return;
    setActionErr(null);
    try {
      await api(`/api/v1/maintenance/tickets/${t.id}`, { method: 'PATCH', body });
      reload();
    } catch (e) {
      setActionErr(e);
    }
  }

  return (
    <>
      <div className="spread">
        <h1>Mantenimiento</h1>
        <Btn variant="primary" onClick={() => setCreating(true)}>
          + Reportar incidencia
        </Btn>
      </div>

      {creating && (
        <TicketForm
          onClose={() => {
            setCreating(false);
            reload();
          }}
        />
      )}

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
          <Field label="Prioridad">
            <Select value={filtros.prioridad} onChange={setFiltro('prioridad')}>
              <option value="">Todas</option>
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>
                  {p}
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
        </div>
      </Card>

      <ErrorMsg error={actionErr} />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMsg error={error} />
      ) : (
        <Card title="Tickets">
          <Table
            headers={[
              '#',
              'Habitación',
              'Tipo',
              'Prioridad',
              'Descripción',
              'Reportado por',
              'Creado',
              'Estado',
              'Acciones',
            ]}
            empty="No hay tickets"
          >
            {(data || []).map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.room?.numero ?? t.roomId}</td>
                <td>{t.tipo}</td>
                <td>{t.prioridad}</td>
                <td>
                  {t.descripcion}
                  {t.resolucion && <div className="muted">Resolución: {t.resolucion}</div>}
                </td>
                <td>{t.reportadoPor?.username || '—'}</td>
                <td>{fmtDateTime(t.creadoEn)}</td>
                <td>
                  <Badge kind={t.estado} />
                </td>
                <td className="row">
                  {(TRANSICIONES[t.estado] || [])
                    .filter((s) => s !== 'CANCELADO' || admin)
                    .map((s) => (
                      <Btn
                        key={s}
                        variant={s === 'CANCELADO' ? 'sm btn-danger' : 'sm'}
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

function TicketForm({ onClose }) {
  const rooms = useData('/api/v1/rooms?pageSize=100');
  const [form, setForm] = useState({ roomId: '', tipo: 'AVERIA', prioridad: 'MEDIA', descripcion: '' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await api('/api/v1/maintenance/tickets', {
        method: 'POST',
        body: { ...form, roomId: Number(form.roomId) },
      });
      onClose();
    } catch (errApi) {
      setErr(errApi);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Reportar incidencia">
      <ErrorMsg error={err || rooms.error} />
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
          <Field label="Prioridad *">
            <Select value={form.prioridad} onChange={set('prioridad')}>
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Descripción *">
            <Input value={form.descripcion} onChange={set('descripcion')} required />
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
