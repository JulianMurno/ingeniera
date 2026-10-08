'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, todayISO } from '@/lib/api';
import {
  Badge,
  Btn,
  Card,
  ErrorMsg,
  Field,
  Input,
  Loading,
  Msg,
  Select,
  Table,
  fmtDate,
  fmtDateTime,
  fmtMoney,
  METODOS_PAGO,
} from '@/components/ui';
import { useData } from '@/lib/useData';

export default function ReservaDetail() {
  const { id } = useParams();
  const { data: r, loading, error, reload } = useData(`/api/v1/reservations/${id}`);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const { data: invoice, reload: reloadInvoice } = useData(
    showInvoice ? `/api/v1/reservations/${id}/invoices` : null,
  );

  if (loading) return <Loading />;
  if (error) return <ErrorMsg error={error} />;
  if (!r) return <p className="muted">Reserva no encontrada</p>;

  async function run(accion, extra = {}) {
    setErr(null);
    setMsg('');
    try {
      await api(`/api/v1/reservations/${id}/${accion}`, { method: 'POST', body: extra });
      setMsg('Operación realizada.');
      reload();
    } catch (e) {
      setErr(e);
    }
  }

  const transiciones = {
    CONFIRMADA: ['checkin', 'cancel', 'no-show'],
    EN_CURSO: ['checkout'],
  };

  return (
    <>
      <div className="spread">
        <h1>
          Reserva {r.codigo || `#${r.id}`}{' '}
          <Badge kind={r.estado} /> <Badge kind={r.estadoPago} />
        </h1>
        <Link href="/reservas" className="btn btn-sm">
          ← Volver
        </Link>
      </div>

      <ErrorMsg error={err} />
      <Msg>{msg}</Msg>

      <div className="grid grid-2">
        <Card title="Estancia">
          <Table
            headers={['Campo', 'Valor']}
            empty=""
          >
            <tr>
              <td>Huésped</td>
              <td>
                {r.guest?.nombre} · DNI {r.guest?.dni}
              </td>
            </tr>
            <tr>
              <td>Habitación</td>
              <td>
                {r.room?.numero} — {r.room?.tipo} · tarifa base {fmtMoney(r.room?.tarifaBase)}
              </td>
            </tr>
            <tr>
              <td>Rango</td>
              <td>
                {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)} ({r.noches} noches)
              </td>
            </tr>
            <tr>
              <td>Ocupantes</td>
              <td>
                {r.adultos} adulto(s) + {r.menores} menor(es)
              </td>
            </tr>
            <tr>
              <td>Total</td>
              <td className="money">{fmtMoney(r.total)}</td>
            </tr>
            <tr>
              <td>Pagado / Saldo</td>
              <td>
                <span className="money">{fmtMoney(r.totalPagado)}</span> /{' '}
                <span className="money">{fmtMoney(r.saldoPendiente)}</span>
              </td>
            </tr>
            {r.notas && (
              <tr>
                <td>Notas</td>
                <td>{r.notas}</td>
              </tr>
            )}
            {r.motivoCancelacion && (
              <tr>
                <td>Motivo de cancelación</td>
                <td>{r.motivoCancelacion}</td>
              </tr>
            )}
          </Table>
        </Card>

        <Card title="Acciones">
          {(transiciones[r.estado] || []).includes('checkin') && (
            <Btn variant="ok" onClick={() => run('checkin')}>
              Check-in
            </Btn>
          )}
          {(transiciones[r.estado] || []).includes('checkout') && (
            <Btn variant="ok" onClick={() => run('checkout')}>
              Check-out
            </Btn>
          )}
          {(transiciones[r.estado] || []).includes('cancel') && (
            <CancelForm onCancel={(motivo) => run('cancel', { motivo })} />
          )}
          {(transiciones[r.estado] || []).includes('no-show') && (
            <Btn variant="warn" onClick={() => run('no-show')}>
              Marcar no-show
            </Btn>
          )}
          {!transiciones[r.estado] && (
            <p className="muted">Estado terminal: no hay transiciones disponibles.</p>
          )}
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn onClick={() => setShowInvoice((v) => !v)}>
              {showInvoice ? 'Ocultar factura' : 'Ver factura'}
            </Btn>
          </div>
        </Card>
      </div>

      {showInvoice && <InvoiceCard invoice={invoice} onRefresh={reloadInvoice} />}

      <PagosCard reserva={r} onChanged={reload} />
    </>
  );
}

function CancelForm({ onCancel }) {
  const [motivo, setMotivo] = useState('');
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <Field label="Motivo de cancelación">
        <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </Field>
      <Btn variant="danger" onClick={() => onCancel(motivo)}>
        Cancelar
      </Btn>
    </div>
  );
}

function PagosCard({ reserva, onChanged }) {
  const [form, setForm] = useState({ monto: '', metodo: 'EFECTIVO', pagadoEn: todayISO() });
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setOk('');
    try {
      await api(`/api/v1/reservations/${reserva.id}/payments`, {
        method: 'POST',
        body: {
          monto: Number(form.monto),
          metodo: form.metodo,
          pagadoEn: form.pagadoEn || undefined,
        },
      });
      setForm((f) => ({ ...f, monto: '' }));
      setOk('Pago registrado.');
      onChanged();
    } catch (errApi) {
      setErr(errApi);
    }
  }

  return (
    <Card title={`Pagos (${(reserva.pagos || []).length})`}>
      <ErrorMsg error={err} />
      <Msg>{ok}</Msg>
      <Table headers={['Fecha', 'Monto', 'Método', 'Registrado']} empty="Sin pagos todavía">
        {(reserva.pagos || []).map((p) => (
          <tr key={p.id}>
            <td>{fmtDate(p.pagadoEn)}</td>
            <td className="money">{fmtMoney(p.monto)}</td>
            <td>{p.metodo}</td>
            <td>{fmtDateTime(p.createdAt)}</td>
          </tr>
        ))}
      </Table>
      <form onSubmit={onSubmit} className="row" style={{ marginTop: 12 }}>
        <Field label="Monto">
          <Input
            type="number"
            min="1"
            required
            value={form.monto}
            onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
          />
        </Field>
        <Field label="Método">
          <Select
            value={form.metodo}
            onChange={(e) => setForm((f) => ({ ...f, metodo: e.target.value }))}
          >
            {METODOS_PAGO.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha de cobro">
          <Input
            type="date"
            value={form.pagadoEn}
            onChange={(e) => setForm((f) => ({ ...f, pagadoEn: e.target.value }))}
          />
        </Field>
        <Btn type="submit" variant="primary">
          Registrar pago
        </Btn>
      </form>
    </Card>
  );
}

function InvoiceCard({ invoice, onRefresh }) {
  return (
    <Card
      title={`Factura ${invoice?.numero || ''}`}
      actions={
        <Btn onClick={onRefresh} variant="sm">
          Actualizar
        </Btn>
      }
    >
      {!invoice ? (
        <Loading />
      ) : (
        <div className="grid grid-2">
          <Table
            headers={['Concepto', 'Detalle']}
            empty=""
          >
            <tr>
              <td>Cliente</td>
              <td>
                {invoice.cliente?.nombre} · DNI {invoice.cliente?.dni} · {invoice.cliente?.email}
              </td>
            </tr>
            <tr>
              <td>Habitación</td>
              <td>
                {invoice.habitacion?.numero} — {invoice.habitacion?.tipo}
              </td>
            </tr>
            <tr>
              <td>Estancia</td>
              <td>
                {fmtDate(invoice.estancia?.checkIn)} → {fmtDate(invoice.estancia?.checkOut)} (
                {invoice.estancia?.noches} noches, {invoice.estancia?.adultos} adulto(s)
                {invoice.estancia?.menores ? ` + ${invoice.estancia?.menores} menor(es)` : ''})
              </td>
            </tr>
            <tr>
              <td>Tarifa promedio por noche</td>
              <td className="money">{fmtMoney(invoice.tarifaPromedioPorNoche)}</td>
            </tr>
            <tr>
              <td>Total</td>
              <td className="money">{fmtMoney(invoice.total)}</td>
            </tr>
            <tr>
              <td>Pagado</td>
              <td className="money">{fmtMoney(invoice.totalPagado)}</td>
            </tr>
            <tr>
              <td>Saldo pendiente</td>
              <td className="money">{fmtMoney(invoice.saldoPendiente)}</td>
            </tr>
          </Table>
          <div>
            <strong>Pagos incluidos</strong>
            <Table headers={['Fecha', 'Monto', 'Método']} empty="Sin pagos">
              {(invoice.pagos || []).map((p) => (
                <tr key={p.id}>
                  <td>{fmtDate(p.pagadoEn)}</td>
                  <td className="money">{fmtMoney(p.monto)}</td>
                  <td>{p.metodo}</td>
                </tr>
              ))}
            </Table>
          </div>
        </div>
      )}
    </Card>
  );
}