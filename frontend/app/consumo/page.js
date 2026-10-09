'use client';

import { useState } from 'react';
import { getToken } from '@/lib/api';
import { useData } from '@/hooks/useData';
import { CATEGORIA_LABEL, fmtMoney, todayISO, toISODate } from '@/lib/format';
import { Btn, Card, ErrorMsg, Field, Input, Loading, Table } from '@/components/ui';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

export default function ConsumoPage() {
  const [desde, setDesde] = useState(() => daysAgo(30));
  const [hasta, setHasta] = useState(() => todayISO());
  const [rango, setRango] = useState(null);

  const qs = rango ? new URLSearchParams({ desde: rango.desde, hasta: rango.hasta }).toString() : null;
  const { data, loading, error, reload } = useData(qs ? `/extras/consumo?${qs}` : null);

  if (!getToken()) {
    return (
      <Card title="Inicia sesión">
        <p className="muted">Necesitás sesión para ver el reporte de consumo.</p>
      </Card>
    );
  }

  function aplicar(e) {
    e.preventDefault();
    setRango({ desde, hasta });
  }

  const items = data || [];
  const total = items.reduce((acc, item) => acc + item.importe, 0);

  return (
    <>
      <div className="spread">
        <h1>Reporte de consumo de servicios</h1>
      </div>

      <Card>
        <form className="row" onSubmit={aplicar}>
          <Field label="Desde">
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} required />
          </Field>
          <Field label="Hasta">
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} required />
          </Field>
          <Btn type="submit" variant="primary">
            Consultar
          </Btn>
          <Btn onClick={reload}>Refrescar</Btn>
        </form>
        <p className="muted">
          Solo se consideran cargos vigentes (no anulados) registrados dentro del rango.
        </p>
      </Card>

      <ErrorMsg error={error} />

      {loading ? (
        <Loading />
      ) : (
        <Card>
          <div className="spread" style={{ marginBottom: 12 }}>
            <span className="muted">
              {rango ? `${rango.desde} → ${rango.hasta}` : 'Elegí un rango para consultar'}
            </span>
            <span className="stat-value">{fmtMoney(total)}</span>
          </div>
          <Table
            headers={['Código', 'Servicio', 'Categoría', 'Cantidad', 'Importe']}
            empty="No hay consumo en el período"
          >
            {items.map((item, i) => (
              <tr key={i}>
                <td>{item.codigo || item.extraId}</td>
                <td>{item.nombre || '—'}</td>
                <td>{CATEGORIA_LABEL[item.categoria] || item.categoria || '—'}</td>
                <td>{item.cantidad}</td>
                <td className="money">{fmtMoney(item.importe)}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </>
  );
}