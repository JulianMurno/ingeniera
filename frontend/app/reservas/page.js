'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getToken } from '@/lib/api';
import { useData } from '@/hooks/useData';
import { Badge, Btn, Card, ErrorMsg, Loading, Table } from '@/components/ui';
import { fmtDate, fmtEstado, fmtMoney } from '@/lib/format';

const PAGE_SIZE = 10;

export default function ReservasPage() {
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState('');

  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('pageSize', String(PAGE_SIZE));
  if (estado) qs.set('estado', estado);

  const { data, pagination, loading, error, reload } = useData(`/reservations?${qs}`);

  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / PAGE_SIZE)) : 1;

  if (!getToken()) {
    return (
      <Card title="Inicia sesión">
        <p className="muted">
          Para gestionar cargos necesitás una sesión. Usá el formulario del encabezado (seed:{' '}
          <code>admin</code> / <code>recepcionista</code>, clave <code>123456</code>).
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="spread">
        <h1>Reservas</h1>
      </div>

      <ErrorMsg error={error} />

      <Card>
        <div className="row">
          <Field label="Estado">
            <select className="select" value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1); }}>
              <option value="">Todos</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="EN_CURSO">En curso</option>
              <option value="FINALIZADA">Finalizada</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="NO_SHOW">No show</option>
            </select>
          </Field>
          <Btn onClick={reload}>Refrescar</Btn>
        </div>
      </Card>

      <Card>
        {loading ? (
          <Loading />
        ) : (
          <>
            <Table
              headers={['Código', 'Huésped', 'Habitación', 'Rango', 'Total estadía', 'Estado']}
              empty="No hay reservas que coincidan"
            >
              {(data || []).map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/reservas/${r.id}`}>{r.codigo || `#${r.id}`}</Link>
                  </td>
                  <td>{r.guest?.nombre || r.guestId}</td>
                  <td>{r.room?.numero || r.roomId}</td>
                  <td>
                    {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}
                  </td>
                  <td className="money">{fmtMoney(r.total)}</td>
                  <td>
                    <Badge>{fmtEstado(r.estado)}</Badge>
                  </td>
                </tr>
              ))}
            </Table>
            {pagination && (
              <div className="pager">
                <span className="muted">
                  Página {pagination.page} de {totalPages} · {pagination.total} reservas
                </span>
                <div className="card-actions">
                  <Btn size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Anterior
                  </Btn>
                  <Btn size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Siguiente
                  </Btn>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </>
  );
}