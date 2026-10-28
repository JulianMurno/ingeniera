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

function Stat({ href, label, value, icon }) {
  return (
    <Link href={href} className="stat-link">
      <Card>
        <div className="stat" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {icon && <div style={{ fontSize: 32 }}>{icon}</div>}
          <div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
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
        <div>
          <h1 style={{ marginBottom: 8 }}>Panel de Control</h1>
          <p className="muted" style={{ margin: 0 }}>Gestión integral del hotel</p>
        </div>
        {state.health && (
          <div className="spread" style={{ gap: 12, padding: '8px 16px', background: '#fff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <span className="muted" style={{ fontSize: 13 }}>Sistema</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Badge kind={state.health.status === 'ok' ? 'ok' : 'down'} />
              <span className="muted" style={{ fontSize: 13 }}>API</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Badge kind={state.health.db === 'ok' ? 'ok' : 'down'} />
              <span className="muted" style={{ fontSize: 13 }}>BD</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-3">
        <Stat href="/reservas" label="Reservas totales" value={pagination?.total ?? '—'} icon="📅" />
        <Stat href="/huespedes" label="Huéspedes" value={'—'} icon="👥" />
        <Stat href="/habitaciones" label="Habitaciones" value={'—'} icon="🛏️" />
      </div>

      <Card
        title="Últimas reservas"
        actions={
          <Link href="/reservas" className="btn btn-primary btn-sm">
            Ver todas →
          </Link>
        }
      >
        <Table
          headers={['Código', 'Huésped', 'Habitación', 'Rango', 'Total', 'Estado']}
          empty="No hay reservas registradas"
        >
          {(state.reservas?.data || []).map((r) => (
            <tr key={r.id}>
              <td>
                <Link href={`/reservas/${r.id}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  {r.codigo || `#${r.id}`}
                </Link>
              </td>
              <td style={{ fontWeight: 500 }}>{r.guest?.nombre || r.guestId}</td>
              <td>{r.room?.numero || r.roomId}</td>
              <td className="muted">
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