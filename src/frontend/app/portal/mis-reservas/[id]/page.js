'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
  PageHeader,
  Table,
  buttonVariants,
  fmtDate,
  fmtMoney,
} from '@/components/ui';
import { useData } from '@/lib/useData';
import RequireGuest from '@/components/RequireGuest';

function ReservaDetalleContent() {
  const { id } = useParams();
  const { data: reservation, loading, error, reload } = useData(
    `/api/v1/guest/reservations/${id}`,
  );
  const [motivo, setMotivo] = useState('');
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (error) return <ErrorMsg error={error} />;
  if (!reservation) return <p className="text-[13px] text-muted">Reserva no encontrada</p>;

  async function cancelar() {
    setErr(null);
    setMsg('');
    setBusy(true);
    try {
      await api(`/api/v1/guest/reservations/${id}/cancel`, {
        method: 'POST',
        body: motivo.trim() ? { motivo: motivo.trim() } : {},
      });
      setMsg('Reserva cancelada.');
      setMotivo('');
      reload();
    } catch (errApi) {
      setErr(errApi);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            Reserva {reservation.codigo || `#${reservation.id}`}{' '}
            <Badge kind={reservation.estado} />
          </span>
        }
        actions={
          <Link href="/portal/mis-reservas" className={buttonVariants({ size: 'sm' })}>
            ← Volver
          </Link>
        }
      />

      <ErrorMsg error={err} />
      <Msg>{msg}</Msg>

      <Card title="Detalle">
        <Table headers={['Campo', 'Valor']} empty="">
          <tr>
            <td>Habitación</td>
            <td>
              {reservation.room?.numero} — {reservation.room?.tipo}
            </td>
          </tr>
          <tr>
            <td>Fechas</td>
            <td>
              {fmtDate(reservation.checkIn)} → {fmtDate(reservation.checkOut)} (
              {reservation.noches} noche(s))
            </td>
          </tr>
          <tr>
            <td>Ocupantes</td>
            <td>
              {reservation.adultos} adulto(s) + {reservation.menores} menor(es)
            </td>
          </tr>
          <tr>
            <td>Total</td>
            <td className="font-semibold tabular-nums">{fmtMoney(reservation.total)}</td>
          </tr>
          {reservation.notas && (
            <tr>
              <td>Notas</td>
              <td>{reservation.notas}</td>
            </tr>
          )}
          {reservation.motivoCancelacion && (
            <tr>
              <td>Motivo de cancelación</td>
              <td>{reservation.motivoCancelacion}</td>
            </tr>
          )}
        </Table>
      </Card>

      {reservation.estado === 'CONFIRMADA' && (
        <Card title="Cancelar reserva">
          <div className="flex flex-wrap items-end gap-4">
            <Field label="Motivo (opcional)">
              <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </Field>
            <Btn type="button" variant="danger" onClick={cancelar} disabled={busy}>
              {busy ? 'Cancelando...' : 'Cancelar reserva'}
            </Btn>
          </div>
        </Card>
      )}
    </>
  );
}

export default function ReservaDetallePage() {
  return (
    <RequireGuest>
      <ReservaDetalleContent />
    </RequireGuest>
  );
}
