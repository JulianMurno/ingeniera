'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Btn, ErrorMsg, Field, Input, Msg, Select, UNIDAD_LABEL, fmtMoney } from '@/components/ui';

export default function FormCargo({ extras, reservationId, onDone }) {
  const [extraId, setExtraId] = useState(extras[0]?.id || '');
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState('');
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const selected = extras.find((e) => e.id === Number(extraId));
  const importe = selected ? selected.precio * Number(cantidad || 0) : 0;

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setOk('');
    setBusy(true);
    try {
      const body = { extraId: Number(extraId), cantidad: Number(cantidad) };
      if (nota) body.nota = nota;
      await api(`/api/v1/reservations/${reservationId}/charges`, { method: 'POST', body });
      setOk('Cargo registrado.');
      setCantidad(1);
      setNota('');
      onDone();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <ErrorMsg error={error} />
      <Msg>{ok}</Msg>
      <div className="row">
        <Field label="Servicio">
          <Select value={extraId} onChange={(e) => setExtraId(e.target.value)}>
            {extras.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre} ({fmtMoney(e.precio)} / {UNIDAD_LABEL[e.unidad] || e.unidad})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cantidad">
          <Input
            type="number"
            min="1"
            step="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            required
          />
        </Field>
        <Field label="Nota">
          <Input value={nota} onChange={(e) => setNota(e.target.value)} />
        </Field>
        <Field label="Importe estimado">
          <span className="money">{fmtMoney(importe)}</span>
        </Field>
        <Btn type="submit" variant="primary" disabled={busy}>
          Registrar cargo
        </Btn>
      </div>
    </form>
  );
}
