'use client';

import { useParams, useRouter } from 'next/navigation';
import { getToken, api, isAdmin } from '@/lib/api';
import { useData } from '@/hooks/useData';
import { fmtDate, fmtDateTime, fmtEstado, fmtMoney } from '@/lib/format';
import { Badge, Btn, Card, ErrorMsg, Loading, Table } from '@/components/ui';
import FormCargo from '@/components/FormCargo';

function ResumenItem({ label, value }) {
  return (
    <div className="resumen-item">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

export default function ReservaDetallePage() {
  const params = useParams();
  const router = useRouter();
  const admin = isAdmin();
  const id = params.id;

  const res = useData(id ? `/reservations/${id}` : null);
  const cargos = useData(id ? `/reservations/${id}/charges` : null);
  const extras = useData('/extras?pageSize=100');

  const reservation = res.raw || res.data;
  const admiteCargos = ['CONFIRMADA', 'EN_CURSO'].includes(reservation?.estado);
  const provisionados = (extras.data || []).filter((e) => e.activo);

  if (!getToken()) {
    return (
      <Card title="Inicia sesión">
        <p className="muted">
          Necesitás sesión para ver cargos. Usá el formulario del encabezado.
        </p>
      </Card>
    );
  }

  if (res.loading || cargos.loading || extras.loading) return <Loading />;
  if (res.error) return <ErrorMsg error={res.error} />;

  return (
    <>
      <div className="spread">
        <h1>
          Reserva {reservation.codigo || `#${reservation.id}`}
        </h1>
        <Btn onClick={() => router.back()}>Volver</Btn>
      </div>

      <div className="grid grid-3">
        <Card title="Reserva">
          <div className="muted">Huésped</div>
          <div>{reservation.guest?.nombre || reservation.guestId}</div>
          <div className="muted" style={{ marginTop: 8 }}>
            Habitación
          </div>
          <div>{reservation.room?.numero || reservation.roomId}</div>
          <div className="muted" style={{ marginTop: 8 }}>
            Rango
          </div>
          <div>
            {fmtDate(reservation.checkIn)} → {fmtDate(reservation.checkOut)}
          </div>
          <div style={{ marginTop: 8 }}>
            <Badge>{fmtEstado(reservation.estado)}</Badge>
          </div>
        </Card>

        {cargos.error ? (
          <Card title="Resumen">
            <ErrorMsg error={cargos.error} />
          </Card>
        ) : (
          <Card title="Resumen de cargos">
            <div className="resumen-grid">
              <ResumenItem label="Estadía" value={fmtMoney(cargos.raw?.resumen?.totalEstadia)} />
              <ResumenItem label="Servicios" value={fmtMoney(cargos.raw?.resumen?.totalServicios)} />
              <ResumenItem label="Total general" value={fmtMoney(cargos.raw?.resumen?.totalGeneral)} />
              <ResumenItem label="Cargos" value={cargos.raw?.resumen?.cantidadCargos ?? '—'} />
            </div>
            <Btn size="sm" onClick={cargos.reload}>
              Refrescar resumen
            </Btn>
          </Card>
        )}
      </div>

      {admin && admiteCargos && (
        <Card title="Registrar cargo">
          {provisionados.length ? (
            <FormCargo
              extras={provisionados}
              reservationId={id}
              onDone={() => { cargos.reload(); res.reload(); }}
            />
          ) : (
            <p className="muted">
              No hay servicios activos cargados en el catálogo.
            </p>
          )}
        </Card>
      )}

      <Card title="Cargos registrados">
        {cargos.loading ? (
          <Loading />
        ) : (
          <>
            <Table
              headers={['Servicio', 'Cantidad', 'P. unitario', 'Importe', 'Estado', 'Fecha', 'Nota', 'Registrado por', 'Acciones']}
              empty="Esta reserva no tiene cargos"
            >
              {(cargos.data || []).map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.extra?.nombre || c.extraId}
                    {c.extra && <div className="muted">{c.extra.codigo}</div>}
                  </td>
                  <td>{c.cantidad}</td>
                  <td className="money">{fmtMoney(c.precioUnitario)}</td>
                  <td className="money">{fmtMoney(c.importe)}</td>
                  <td>
                    <Badge>{c.estado === 'CANCELADO' ? 'cancelado' : 'pendiente'}</Badge>
                  </td>
                  <td>{fmtDateTime(c.creadoEn)}</td>
                  <td>{c.nota || '—'}</td>
                  <td>
                    {c.registradoPor ? `${c.registradoPor.username} (${c.registradoPor.rol})` : c.registradoPorId}
                  </td>
                  <td>
                    {admin && c.estado === 'PENDIENTE' && (
                      <Btn
                        size="sm"
                        variant="danger"
                        onClick={async () => {
                          if (!window.confirm('¿Anular este cargo?')) return;
                          try {
                            await api(`/reservations/${id}/charges/${c.id}`, { method: 'PATCH' });
                            cargos.reload();
                            res.reload();
                          } catch (e) {
                            window.alert(e.message);
                          }
                        }}
                      >
                        Anular
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          </>
        )}
      </Card>
    </>
  );
}