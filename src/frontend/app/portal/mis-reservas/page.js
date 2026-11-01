'use client';

import Link from 'next/link';
import { Card, ErrorMsg, Loading, Table, Badge, fmtDate, fmtMoney } from '@/components/ui';
import { useData } from '@/lib/useData';
import RequireGuest from '@/components/RequireGuest';

function MisReservasContent() {
  const { data, loading, error } = useData('/api/v1/guest/reservations?pageSize=100');
  const reservations = data || [];

  if (loading) return <Loading />;
  if (error) return <ErrorMsg error={error} />;

  return (
    <>
      <div className="spread">
        <h1>Mis reservas</h1>
        <Link href="/portal/reservar" className="btn btn-primary btn-sm">
          Nueva reserva
        </Link>
      </div>

      <Card title={`Reservas (${reservations.length})`}>
        <Table
          headers={['Código', 'Habitación', 'Fechas', 'Ocupantes', 'Total', 'Estado', '']}
          empty="Todavía no tiene reservas"
        >
          {reservations.map((reservation) => (
            <tr key={reservation.id}>
              <td>{reservation.codigo || `#${reservation.id}`}</td>
              <td>
                {reservation.room?.numero} — {reservation.room?.tipo}
              </td>
              <td>
                {fmtDate(reservation.checkIn)} → {fmtDate(reservation.checkOut)} (
                {reservation.noches} noche(s))
              </td>
              <td>
                {reservation.adultos} adulto(s) + {reservation.menores} menor(es)
              </td>
              <td className="money">{fmtMoney(reservation.total)}</td>
              <td>
                <Badge kind={reservation.estado} />
              </td>
              <td>
                <Link
                  href={`/portal/mis-reservas/${reservation.id}`}
                  className="btn btn-sm"
                >
                  Ver detalle
                </Link>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}

export default function MisReservasPage() {
  return (
    <RequireGuest>
      <MisReservasContent />
    </RequireGuest>
  );
}
