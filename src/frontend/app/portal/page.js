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
import RequireGuest from '@/components/RequireGuest';

function addDaysISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

export default function GuestPortalPage() {
  const [form, setForm] = useState({
    checkIn: addDaysISO(1),
    checkOut: addDaysISO(2),
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
    <RequireGuest>
      <div className="spread">
        <h1>Mi portal</h1>
        <Link href="/portal/mis-reservas" className="btn btn-sm">
          Mis reservas
        </Link>
      </div>

      <Card title="Buscar disponibilidad">
        <form onSubmit={consultar} className="row">
          <Field label="Check-in *">
            <Input
              type="date"
              min={todayISO()}
              value={form.checkIn}
              onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))}
              required
            />
          </Field>
          <Field label="Check-out *">
            <Input
              type="date"
              min={form.checkIn}
              value={form.checkOut}
              onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))}
              required
            />
          </Field>
          <Field label="Tipo">
            <Select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="">Todos</option>
              {Object.values(ROOM_TYPES).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ocupantes">
            <Input
              type="number"
              min="1"
              value={form.ocupantes}
              onChange={(e) => setForm((f) => ({ ...f, ocupantes: e.target.value }))}
            />
          </Field>
          <Btn type="submit" variant="primary" disabled={busy}>
            Buscar
          </Btn>
        </form>
      </Card>

      <ErrorMsg error={err} />

      {rooms && (
        <Card title={`Habitaciones disponibles (${rooms.length})`}>
          <Table
            headers={['Nº', 'Tipo', 'Capacidad', 'Tarifa/noche', '']}
            empty="No hay habitaciones libres en el rango"
          >
            {rooms.map((room) => (
              <tr key={room.id}>
                <td>{room.numero}</td>
                <td>{room.tipo}</td>
                <td>{room.capacidad} pax</td>
                <td className="money">{fmtMoney(room.tarifa)}</td>
                <td>
                  <Link
                    href={`/portal/reservar?roomId=${room.id}&checkIn=${form.checkIn}&checkOut=${form.checkOut}`}
                    className="btn btn-sm btn-primary"
                  >
                    Reservar
                  </Link>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {rooms && rooms.length === 0 && !busy && (
        <p className="muted">Sin resultados para esa búsqueda.</p>
      )}
      {busy && <Loading />}
    </RequireGuest>
  );
}
