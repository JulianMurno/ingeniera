'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { todayISO } from '@/lib/api';
import { useData } from '@/lib/useData';
import { Btn, Card, EmptyState, ErrorMsg, Loading, fmtDate } from '@/components/ui';
import { CALENDAR_DAYS, ESTADO_CELDA, addDaysISO, buildCalendarRows, buildRange } from '@/lib/calendar';

const STICKY_HEADER_CLASSES =
  'sticky top-0 z-10 border-b border-border-soft bg-surface-strong px-2 py-2 text-[11px] font-bold tracking-[0.08em] text-muted uppercase';
const STICKY_CORNER_CLASSES = `${STICKY_HEADER_CLASSES} left-0 z-30 min-w-[140px] text-left`;
const ROOM_HEADER_CLASSES =
  'sticky left-0 z-20 min-w-[140px] border-b border-border-soft bg-surface-strong px-3 py-2 text-left text-[13px] font-semibold';
// `relative` contiene los labels `sr-only` (absolute) dentro de la celda; si no,
// escapan al containing block del documento y estiran el ancho de toda la página.
const CELL_CLASSES = 'relative border-b border-l border-border-soft p-0.5 align-middle';

function dayLabel(fecha) {
  return `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;
}

function CalendarCell({ room, celda }) {
  if (celda.estado === ESTADO_CELDA.RESERVADA) {
    const { reserva } = celda;
    const codigo = reserva.codigo || `#${reserva.id}`;

    return (
      <td className={CELL_CLASSES}>
        <Link
          href={`/reservas/${reserva.id}`}
          title={codigo}
          aria-label={`Habitación ${room.numero}, ${celda.fecha}, reserva ${codigo}`}
          className="flex h-10 items-center justify-center rounded-control border border-primary bg-surface text-[11px] font-semibold text-primary-dark no-underline"
        >
          {celda.mostrarCodigo ? codigo : ''}
        </Link>
      </td>
    );
  }

  if (celda.estado === ESTADO_CELDA.MANTENIMIENTO) {
    return (
      <td className={CELL_CLASSES}>
        <span
          title="En mantenimiento"
          className="flex h-10 items-center justify-center text-[11px] text-muted"
        >
          Mant.
        </span>
      </td>
    );
  }

  return (
    <td className={CELL_CLASSES}>
      <span className="flex h-10 items-center justify-center rounded-control bg-success-soft">
        <span className="sr-only">Disponible</span>
      </span>
    </td>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted">
      <span className="font-semibold text-foreground">Leyenda:</span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-4 w-4 rounded-control bg-success-soft" aria-hidden="true" />
        Disponible
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block h-4 w-6 rounded-control border border-primary bg-surface"
          aria-hidden="true"
        />
        Reservada
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block text-[11px] font-semibold" aria-hidden="true">
          Mant.
        </span>
        En mantenimiento
      </span>
    </div>
  );
}

export default function ReservationCalendar() {
  const [inicio, setInicio] = useState(todayISO());
  const fechas = useMemo(() => buildRange(inicio, CALENDAR_DAYS), [inicio]);
  const hasta = addDaysISO(inicio, CALENDAR_DAYS);

  const { data, loading, error } = useData(
    `/api/v1/reservations/calendar?desde=${inicio}&hasta=${hasta}`,
  );

  const rows = useMemo(
    () => buildCalendarRows(data?.rooms, data?.reservations, fechas),
    [data, fechas],
  );

  return (
    <Card
      title="Calendario"
      actions={
        <div className="flex flex-wrap gap-2">
          <Btn
            type="button"
            size="sm"
            aria-label="Rango anterior"
            onClick={() => setInicio((fecha) => addDaysISO(fecha, -CALENDAR_DAYS))}
          >
            Anterior
          </Btn>
          <Btn
            type="button"
            size="sm"
            aria-label="Rango siguiente"
            onClick={() => setInicio((fecha) => addDaysISO(fecha, CALENDAR_DAYS))}
          >
            Siguiente
          </Btn>
          <Btn
            type="button"
            size="sm"
            aria-label="Volver al rango de hoy"
            onClick={() => setInicio(todayISO())}
          >
            Hoy
          </Btn>
        </div>
      }
    >
      <p className="mb-3 text-[13px] text-muted">
        Mostrando {fmtDate(fechas[0])} → {fmtDate(fechas[fechas.length - 1])}
      </p>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMsg error={error} />
      ) : rows.length === 0 ? (
        <EmptyState>No hay habitaciones registradas</EmptyState>
      ) : (
        <div className="max-h-[70vh] overflow-auto rounded-control border border-border-soft">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className={STICKY_CORNER_CLASSES}>
                  Habitación
                </th>
                {fechas.map((fecha) => (
                  <th
                    key={fecha}
                    scope="col"
                    className={`${STICKY_HEADER_CLASSES} min-w-[64px] text-center`}
                  >
                    {dayLabel(fecha)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ room, celdas }) => (
                <tr key={room.id}>
                  <th scope="row" className={ROOM_HEADER_CLASSES}>
                    {room.numero}
                    <span className="ml-1 text-[11px] font-normal text-muted">({room.tipo})</span>
                  </th>
                  {celdas.map((celda) => (
                    <CalendarCell key={celda.fecha} room={room} celda={celda} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Legend />
    </Card>
  );
}
