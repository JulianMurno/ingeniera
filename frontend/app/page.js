'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Badge,
  Card,
  ErrorMsg,
  Loading,
  Table,
  fmtDate,
  fmtMoney,
} from '@/components/ui';

function Stat({ href, label, value }) {
  return (
    <Link href={href} className="stat-link">
      <Card>
        <div className="stat">
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
        </div>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const [state, setState] = useState({ loading: true, error: null, health: null, reservas: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const health = await api('/health', { auth: false });
        const reservas = await api('/api/v1/reservations?pageSize=5');
        if (alive) setState({ loading: false, error: null, health, reservas });
      } catch (err) {
        if (alive) setState({ loading: false, error: err, health: null, reservas: null });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (state.loading) return <Loading />;
  if (state.error && !state.health) return <ErrorMsg error={state.error} />;

  const { pagination } = state.reservas || {};

  return (
    <>
      <div className="spread">
        <h1>Panel</h1>
        {state.health && (
          <div className="spread" style={{ gap: 8 }}>
            <span className="muted">API</span>
            <Badge kind={state.health.status === 'ok' ? 'ok' : 'down'} />{' '}
            <span className="muted">Base</span>
            <Badge kind={state.health.db === 'ok' ? 'ok' : 'down'} />
          </div>
        )}
      </div>

      <div className="grid grid-3">
        <Stat href="/reservas" label="Reservas" value={pagination?.total ?? '—'} />
        <Stat href="/huespedes" label="Huéspedes" value={'—'} />
        <Stat href="/habitaciones" label="Habitaciones" value={'—'} />
      </div>

      <Card
        title="Últimas reservas"
        actions={
          <Link href="/reservas" className="btn btn-sm">
            Ver todas
          </Link>
        }
      >
        <Table
          headers={['Código', 'Huésped', 'Habitación', 'Rango', 'Total', 'Estado']}
          empty="No hay reservas todavía"
        >
          {(state.reservas?.data || []).map((r) => (
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
                <Badge kind={r.estado} />
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}