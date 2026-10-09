'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import {
  Btn,
  CATEGORIA_LABEL,
  ErrorMsg,
  Field,
  Input,
  Msg,
  Select,
  UNIDAD_LABEL,
} from '@/components/ui';

const CATEGORIAS = Object.keys(CATEGORIA_LABEL);
const UNIDADES = Object.keys(UNIDAD_LABEL);

export default function FormExtra({ initial, onDone, onCancel }) {
  const editing = !!initial;
  const [form, setForm] = useState({
    codigo: initial?.codigo || '',
    nombre: initial?.nombre || '',
    categoria: initial?.categoria || CATEGORIAS[0],
    precio: initial?.precio ?? '',
    unidad: initial?.unidad || 'POR_UNIDAD',
    descripcion: initial?.descripcion || '',
  });
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setOk('');
    setBusy(true);
    try {
      const body = { ...form, precio: Number(form.precio) };
      if (!body.descripcion) delete body.descripcion;
      if (editing) {
        await api(`/api/v1/extras/${initial.id}`, { method: 'PATCH', body });
        setOk('Servicio actualizado.');
      } else {
        await api('/api/v1/extras', { method: 'POST', body });
        setOk('Servicio creado.');
      }
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
      <div className="grid grid-2">
        <Field label="Código *">
          <Input
            value={form.codigo}
            onChange={(e) => set('codigo', e.target.value.toUpperCase())}
            placeholder="ROOM-SERVICE"
            required
          />
        </Field>
        <Field label="Nombre *">
          <Input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required />
        </Field>
        <Field label="Categoría">
          <Select value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {CATEGORIA_LABEL[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Precio (por unidad) *">
          <Input
            type="number"
            min="1"
            step="1"
            value={form.precio}
            onChange={(e) => set('precio', e.target.value)}
            required
          />
        </Field>
        <Field label="Unidad de cobro">
          <Select value={form.unidad} onChange={(e) => set('unidad', e.target.value)}>
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                {UNIDAD_LABEL[u]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Descripción">
          <Input value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
        </Field>
      </div>
      <div className="row">
        <Btn type="submit" variant="primary" disabled={busy}>
          {editing ? 'Guardar cambios' : 'Crear servicio'}
        </Btn>
        {onCancel && (
          <Btn type="button" onClick={onCancel} disabled={busy}>
            Cancelar
          </Btn>
        )}
      </div>
    </form>
  );
}
