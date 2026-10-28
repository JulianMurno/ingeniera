'use client';

import { useState } from 'react';
import { toISODate, todayISO } from '@/lib/api';
import {
  Btn,
  CATEGORIA_LABEL,
  Card,
  ErrorMsg,
  Field,
  Input,
  Loading,
  Table,
  fmtDate,
  fmtMoney,
} from '@/components/ui';
import { useData } from '@/lib/useData';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

export default function ConsumoPage() {
  const [desde, setDesde] = useState(() => daysAgo(30));
  const [hasta, setHasta] = useState(() => todayISO());
  const [rango, setRango] = useState(null);

  const qs = rango ? new URLSearchParams(rango).toString() : null;
  const { data, raw, loading, error } = useData(qs ? `/api/v1/extras/consumo?${qs}` : null);

  function consultar(e) {
    e.preventDefault();
    setRango({ desde, hasta });
  }

  return (
    <>
      <h1>Consumo de servicios</h1>

      <Card title="Período">
        <form className="row" onSubmit={consultar}>
          <Field label="Desde">
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} required />
          </Field>
          <Field label="Hasta">
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} required />
          </Field>
          <Btn type="submit" variant="primary">
            Consultar
          </Btn>
        </form>
        <p className="muted">Solo se consideran los cargos vigentes (no anulados) del período.</p>
      </Card>

      {!rango ? null : loading ? (
        <Loading />
      ) : error ? (
        <ErrorMsg error={error} />
      ) : (
        <Card
          title={`Consumo ${fmtDate(raw?.desde)} → ${fmtDate(raw?.hasta)}`}
          actions={<span className="money">Total: {fmtMoney(raw?.totalPeriodo)}</span>}
        >
          <Table
            headers={['Código', 'Servicio', 'Categoría', 'Cantidad', 'Importe']}
            empty="No hay consumo en el período"
          >
            {(data || []).map((item) => (
              <tr key={item.extraId}>
                <td>{item.codigo}</td>
                <td>{item.nombre}</td>
                <td>{CATEGORIA_LABEL[item.categoria] || item.categoria}</td>
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
