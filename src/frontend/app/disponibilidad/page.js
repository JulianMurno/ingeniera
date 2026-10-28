'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, todayISO } from '@/lib/api';
import {
  Btn,
  Card,
  ErrorMsg,
  Field,
  Input,
  Loading,
  Select,
  Table,
  fmtMoney,
  ROOM_TYPES,
} from '@/components/ui';

export default function DisponibilidadPage() {
  const [form, setForm] = useState({
    checkIn: todayISO(),
    checkOut: todayISO(),
    type: '',
    ocupantes: '',
  });
  const [rooms, setRooms] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function consultar(e) {
    e.preventDefault();
    setErr(null);
    setRooms(null);
    setBusy(true);
    try {
      const q = new URLSearchParams({ checkIn: form.checkIn, checkOut: form.checkOut });
      if (form.type) q.set('type', form.type);
      if (form.ocupantes) q.set('ocupantes', form.ocupantes);
      const res = await api(`/api/v1/availability?${q.toString()}`);
      setRooms(Array.isArray(res) ? res : res.data || []);
    } catch (errApi) {
      setErr(errApi);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Disponibilidad</h1>
      <Card title="Buscar habitaciones libres">
        <form onSubmit={consultar} className="row">
          <Field label="Check-in *">
            <Input type="date" value={form.checkIn} onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))} required />
          </Field>
          <Field label="Check-out *">
            <Input type="date" value={form.checkOut} onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))} required />
          </Field>
          <Field label="Tipo">
            <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="">Todos</option>
              {Object.values(ROOM_TYPES).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Ocupantes">
            <Input type="number" min="1" value={form.ocupantes} onChange={(e) => setForm((f) => ({ ...f, ocupantes: e.target.value }))} />
          </Field>
          <Btn type="submit" variant="primary" disabled={busy}>Buscar</Btn>
        </form>
      </Card>
      <ErrorMsg error={err} />
      {rooms && (
        <Card title={`Libres en el rango (${rooms.length})`}>
          <Table headers={['Nº', 'Tipo', 'Capacidad', 'Tarifa/noche', 'Disponible', '']} empty="No hay habitaciones libres en el rango">
            {rooms.map((r) => (
              <tr key={r.id}>
                <td>{r.numero}</td>
                <td>{r.tipo}</td>
                <td>{r.capacidad} pax</td>
                <td className="money">{fmtMoney(r.tarifa)}</td>
                <td>✓</td>
                <td>
                  <Link href={`/reservas?dni=&fecha=${form.checkIn}`} className="btn btn-sm">
                    Reservar
                  </Link>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
      {rooms && rooms.length === 0 && !busy && <p className="muted">Sin resultados para esa búsqueda.</p>}
      {busy && <Loading />}
    </>
  );
}