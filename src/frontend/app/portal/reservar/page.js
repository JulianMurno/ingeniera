'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api, todayISO } from '@/lib/api';
import {
  Btn,
  Card,
  ErrorMsg,
  Field,
  Input,
  Loading,
  Select,
  fmtMoney,
  ROOM_TYPES,
} from '@/components/ui';
import RequireGuest from '@/components/RequireGuest';

function addDaysISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function ReservarContent() {
  const params = useSearchParams();
  const initialRoomId = params.get('roomId') || '';
  const initialCheckIn = params.get('checkIn') || addDaysISO(1);
  const initialCheckOut = params.get('checkOut') || addDaysISO(2);

  const [form, setForm] = useState({
    roomId: initialRoomId,
    checkIn: initialCheckIn,
    checkOut: initialCheckOut,
    type: '',
    adultos: '1',
    menores: '0',
    notas: '',
  });
  const [rooms, setRooms] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  async function buscar(overrides = {}) {
    const current = { ...form, ...overrides };
    setError(null);
    setBusy(true);
    try {
      const q = new URLSearchParams({
        checkIn: current.checkIn,
        checkOut: current.checkOut,
      });
      if (current.type) q.set('type', current.type);
      if (current.adultos) q.set('ocupantes', String(Number(current.adultos) + Number(current.menores || 0)));
      const res = await api(`/api/v1/availability?${q.toString()}`);
      const list = Array.isArray(res) ? res : res.data || [];
      setRooms(list);
      if (!list.some((room) => String(room.id) === String(current.roomId))) {
        setForm((f) => ({ ...f, roomId: list[0] ? String(list[0].id) : '' }));
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initialRoomId) buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const reservation = await api('/api/v1/guest/reservations', {
        method: 'POST',
        body: {
          roomId: Number(form.roomId),
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          adultos: Number(form.adultos),
          menores: Number(form.menores),
          notas: form.notas.trim() ? form.notas.trim() : undefined,
        },
      });
      setConfirmation(reservation);
      setRooms(null);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  if (confirmation) {
    return (
      <Card title="Reserva confirmada">
        <p>
          Código de confirmación: <strong>{confirmation.codigo}</strong>
        </p>
        <p>
          Habitación {confirmation.room?.numero} · {confirmation.noches} noche(s) · Total{' '}
          <span className="money">{fmtMoney(confirmation.total)}</span>
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/portal/mis-reservas" className="btn btn-primary">
            Ver mis reservas
          </Link>
          <Btn onClick={() => setConfirmation(null)}>Hacer otra reserva</Btn>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="spread">
        <h1>Nueva reserva</h1>
        <Link href="/portal" className="btn btn-sm">
          ← Volver
        </Link>
      </div>

      <ErrorMsg error={error} />

      <Card title="Fechas y ocupantes">
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            buscar();
          }}
        >
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
          <Btn type="submit" disabled={busy}>
            Buscar habitaciones
          </Btn>
        </form>
      </Card>

      <Card title="Datos de la reserva">
        <form onSubmit={onSubmit}>
          <Field label="Habitación disponible *">
            <Select
              value={form.roomId}
              onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
              required
            >
              <option value="">Seleccione una habitación</option>
              {(rooms || []).map((room) => (
                <option key={room.id} value={room.id}>
                  {room.numero} — {room.tipo} · {fmtMoney(room.tarifa)}/noche · {room.capacidad} pax
                </option>
              ))}
            </Select>
          </Field>
          <div className="row">
            <Field label="Adultos *">
              <Input
                type="number"
                min="1"
                value={form.adultos}
                onChange={(e) => setForm((f) => ({ ...f, adultos: e.target.value }))}
                required
              />
            </Field>
            <Field label="Menores">
              <Input
                type="number"
                min="0"
                value={form.menores}
                onChange={(e) => setForm((f) => ({ ...f, menores: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Notas">
            <Input
              value={form.notas}
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
            />
          </Field>
          <Btn
            type="submit"
            variant="primary"
            disabled={busy || !form.roomId}
            style={{ marginTop: 8 }}
          >
            {busy ? 'Procesando...' : 'Confirmar reserva'}
          </Btn>
        </form>
        {rooms && rooms.length === 0 && (
          <p className="muted">No hay habitaciones disponibles para esas fechas.</p>
        )}
        {busy && <Loading />}
      </Card>
    </>
  );
}

export default function GuestReservePage() {
  return (
    <RequireGuest>
      <Suspense fallback={<p className="muted">Cargando…</p>}>
        <ReservarContent />
      </Suspense>
    </RequireGuest>
  );
}
