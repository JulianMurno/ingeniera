'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Badge,
  Card,
  ErrorMsg,
  Loading,
  PageHeader,
  StatCard,
  Table,
  buttonVariants,
  fmtDate,
  fmtMoney,
} from '@/components/ui';

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
      <PageHeader
        title="Panel de Control"
        description="Gestión integral del hotel"
        actions={
          state.health && (
            <div className="flex items-center gap-4 rounded-control border border-border bg-surface px-4 py-2 shadow-card">
              <span className="text-[13px] text-muted">Sistema</span>
              <span className="flex items-center gap-2 text-[13px] text-muted">
                <Badge kind={state.health.status === 'ok' ? 'ok' : 'down'} />
                API
              </span>
              <span className="flex items-center gap-2 text-[13px] text-muted">
                <Badge kind={state.health.db === 'ok' ? 'ok' : 'down'} />
                BD
              </span>
            </div>
          )
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          href="/reservas"
          label="Reservas totales"
          value={pagination?.total ?? '—'}
          icon="📅"
        />
        <StatCard href="/huespedes" label="Huéspedes" value="—" icon="👥" />
        <StatCard href="/habitaciones" label="Habitaciones" value="—" icon="🛏️" />
      </div>

      <Card
        title="Últimas reservas"
        actions={
          <Link href="/reservas" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
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
                <Link
                  href={`/reservas/${r.id}`}
                  className="font-semibold text-primary no-underline hover:text-primary-dark"
                >
                  {r.codigo || `#${r.id}`}
                </Link>
              </td>
              <td className="font-medium">{r.guest?.nombre || r.guestId}</td>
              <td>{r.room?.numero || r.roomId}</td>
              <td className="text-[13px] text-muted">
                {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}
              </td>
              <td className="font-semibold tabular-nums">{fmtMoney(r.total)}</td>
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
