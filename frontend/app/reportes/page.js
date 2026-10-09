'use client';

import { useState } from 'react';
import { api, todayISO } from '@/lib/api';
import {
  Btn,
  Card,
  ErrorMsg,
  Field,
  Input,
  Table,
  fmtDate,
  fmtMoney,
} from '@/components/ui';

export default function ReportesPage() {
  const [form, setForm] = useState({ checkIn: todayISO(), checkOut: todayISO() });
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function consultar(e) {
    e.preventDefault();
    setErr(null);
    setData(null);
    setBusy(true);
    try {
      const q = new URLSearchParams(form);
      const [ocupacion, ingresos, porTipo] = await Promise.all([
        api(`/api/v1/reports/ocupacion?${q.toString()}`),
        api(`/api/v1/reports/ingresos?${q.toString()}`),
        api(`/api/v1/reports/reservas-por-tipo?${q.toString()}`),
      ]);
      setData({ ocupacion, ingresos, porTipo });
    } catch (errApi) {
      setErr(errApi);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Reportes</h1>
      <Card title="Rango de fechas">
        <form onSubmit={consultar} className="row">
          <Field label="Desde *">
            <Input type="date" value={form.checkIn} onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))} required />
          </Field>
          <Field label="Hasta *">
            <Input type="date" value={form.checkOut} onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))} required />
          </Field>
          <Btn type="submit" variant="primary" disabled={busy} style={{ marginLeft: 'auto' }}>
            {busy ? 'Calculando…' : 'Generar reportes'}
          </Btn>
        </form>
      </Card>
      <ErrorMsg error={err} />
      {data && (
        <div className="grid grid-2">
          <Card title="Ocupación">
            <Table headers={['Indicador', 'Valor']} empty="">
              <tr><td>Habitaciones del hotel</td><td>{data.ocupacion.habitaciones}</td></tr>
              <tr><td>Noches del rango</td><td>{data.ocupacion.noches}</td></tr>
              <tr><td>Noches ocupadas</td><td>{data.ocupacion.nochesOcupadas}</td></tr>
              <tr><td>Noches disponibles</td><td>{data.ocupacion.nochesDisponibles}</td></tr>
              <tr>
                <td>Porcentaje de ocupación</td>
                <td className="money">{data.ocupacion.porcentajeOcupacion}%</td>
              </tr>
            </Table>
          </Card>
          <Card title="Ingresos cobrados">
            <p>
              <span className="muted">Total cobrado en el rango:</span>{' '}
              <span className="money" style={{ fontSize: 20 }}>{fmtMoney(data.ingresos.total)}</span>
              <span className="muted"> · {data.ingresos.cantidadPagos} pago(s)</span>
            </p>
            <Table headers={['Método', 'Pagos', 'Total']} empty="Sin pagos en el rango">
              {(data.ingresos.porMetodo || []).map((m) => (
                <tr key={m.metodo}>
                  <td>{m.metodo}</td>
                  <td>{m.cantidad}</td>
                  <td className="money">{fmtMoney(m.total)}</td>
                </tr>
              ))}
            </Table>
          </Card>
          <Card title="Reservas por tipo">
            <Table headers={['Tipo', 'Reservas', 'Habitaciones', 'Ocupación']} empty="Sin reservas vigentes">
              {(data.porTipo.porTipo || []).map((t) => (
                <tr key={t.tipo}>
                  <td>{t.tipo}</td>
                  <td>{t.cantidad}</td>
                  <td>{t.habitaciones}</td>
                  <td>
                    {t.habitaciones > 0
                      ? `${Math.round((t.cantidad / Math.max(1, t.habitaciones * data.porTipo.noches)) * 1000) / 10}%`
                      : '—'}
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
          <Card title="Detalle del rango">
            <Table headers={['Campo', 'Valor']} empty="">
              <tr><td>Rango</td><td>{fmtDate(data.ocupacion.checkIn)} → {fmtDate(data.ocupacion.checkOut)}</td></tr>
              <tr><td>Noches</td><td>{data.porTipo.noches}</td></tr>
              <tr><td>Reservas vigentes</td><td>{data.porTipo.totalReservas}</td></tr>
            </Table>
          </Card>
        </div>
      )}
    </>
  );
}