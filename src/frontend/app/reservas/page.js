'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, todayISO } from '@/lib/api';
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
  fmtDate,
  fmtMoney,
} from '@/components/ui';
import { useData } from '@/lib/useData';

export default function ReservasPage() {
  const [filtros, setFiltros] = useState({ fecha: '', estado: '', dni: '' });
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const params = new URLSearchParams({ page, pageSize: 10 });
  if (filtros.estado) params.set('estado', filtros.estado);
  if (filtros.fecha) params.set('fecha', filtros.fecha);
  if (filtros.dni) params.set('dni', filtros.dni);

  const { data, pagination, loading, error, reload } = useData(
    `/api/v1/reservations?${params.toString()}`,
  );

  return (
    <>
      <div className="spread">
        <h1>Reservas</h1>
        <Btn variant="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Ocultar alta' : '+ Nueva reserva'}
        </Btn>
      </div>

      {showForm && <NuevaReserva onDone={() => { setShowForm(false); reload(); }} />}

      <Card title="Filtros">
        <div className="row">
          <Field label="Fecha (estancia)">
            <Input
              type="date"
              value={filtros.fecha}
              onChange={(e) => {
                setFiltros((f) => ({ ...f, fecha: e.target.value }));
                setPage(1);
              }}
            />
          </Field>
          <Field label="Estado">
            <Select
              value={filtros.estado}
              onChange={(e) => {
                setFiltros((f) => ({ ...f, estado: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="EN_CURSO">En curso</option>
              <option value="FINALIZADA">Finalizada</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="NO_SHOW">No show</option>
            </Select>
          </Field>
          <Field label="DNI del huésped">
            <Input
              value={filtros.dni}
              onChange={(e) => {
                setFiltros((f) => ({ ...f, dni: e.target.value }));
                setPage(1);
              }}
            />
          </Field>
        </div>
      </Card>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMsg error={error} />
      ) : (
        <Card title="Listado">
          <Table
            headers={['Código', 'Huésped', 'Habitación', 'Rango', 'Ocupantes', 'Total', 'Estado', '']}
            empty="No hay reservas que coincidan"
          >
            {(data || []).map((r) => (
              <tr key={r.id}>
                <td>{r.codigo || `#${r.id}`}</td>
                <td>{r.guest?.nombre || r.guestId}</td>
                <td>
                  {r.room?.numero} <span className="muted">({r.room?.tipo})</span>
                </td>
                <td>
                  {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}
                </td>
                <td>
                  {r.adultos} + {r.menores}
                </td>
                <td className="money">{fmtMoney(r.total)}</td>
                <td>
                  <Badge kind={r.estado} />
                </td>
                <td>
                  <Link href={`/reservas/${r.id}`} className="btn btn-sm">
                    Ver
                  </Link>
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

function NuevaReserva({ onDone }) {
  const [form, setForm] = useState({
    guestId: '',
    roomId: '',
    checkIn: todayISO(),
    checkOut: todayISO(),
    adultos: '1',
    menores: '0',
    notas: '',
  });
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const guests = useData('/api/v1/guests?pageSize=100');
  const rooms = useData('/api/v1/rooms?pageSize=100&estado=DISPONIBLE');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setOk('');
    setBusy(true);
    try {
      await api('/api/v1/reservations', {
        method: 'POST',
        body: {
          guestId: Number(form.guestId),
          roomId: Number(form.roomId),
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          adultos: Number(form.adultos),
          menores: Number(form.menores),
          notas: form.notas || undefined,
        },
      });
      setOk('Reserva creada. Se envió el email de confirmación.');
      setForm((f) => ({ ...f, notas: '' }));
      onDone();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Nueva reserva">
      <ErrorMsg error={error} />
      <Msg>{ok}</Msg>
      <form onSubmit={onSubmit}>
        <div className="grid grid-2">
          <Field label="Huésped">
            <Select value={form.guestId} onChange={set('guestId')} required>
              <option value="">Elegir huésped…</option>
              {(guests.data || []).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre} ({g.dni})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Habitación">
            <Select value={form.roomId} onChange={set('roomId')} required>
              <option value="">Elegir habitación…</option>
              {(rooms.data || []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.numero} — {r.tipo} ({r.capacidad} pax)
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Check-in">
            <Input type="date" value={form.checkIn} onChange={set('checkIn')} required />
          </Field>
          <Field label="Check-out">
            <Input type="date" value={form.checkOut} onChange={set('checkOut')} required />
          </Field>
          <Field label="Adultos">
            <Input type="number" min="1" value={form.adultos} onChange={set('adultos')} />
          </Field>
          <Field label="Menores">
            <Input type="number" min="0" value={form.menores} onChange={set('menores')} />
          </Field>
          <Field label="Notas">
            <Input value={form.notas} onChange={set('notas')} />
          </Field>
        </div>
        <Btn type="submit" variant="primary" disabled={busy}>
          {busy ? 'Guardando…' : 'Crear reserva'}
        </Btn>
      </form>
    </Card>
  );
}