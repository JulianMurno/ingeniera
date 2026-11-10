'use client';

import { useState } from 'react';
import {
  Btn,
  Card,
  ErrorMsg,
  Field,
  Input,
  Loading,
  PageHeader,
  Pager,
  Select,
  Table,
  fmtDateTime,
} from '@/components/ui';
import { useData } from '@/lib/useData';

export default function AuditoriaPage() {
  const [filtros, setFiltros] = useState({
    userId: '',
    accion: '',
    recurso: '',
    desde: '',
    hasta: '',
  });
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page, pageSize: 10 });
  Object.entries(filtros).forEach(([k, v]) => v && params.set(k, v));
  const { data, pagination, loading, error } = useData(`/api/v1/audit?${params.toString()}`);

  const set = (k) => (e) => {
    setFiltros((f) => ({ ...f, [k]: e.target.value }));
    setPage(1);
  };

  return (
    <>
      <PageHeader title="Auditoría" />
      <Card title="Filtros">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="ID de usuario">
            <Input type="number" min="1" value={filtros.userId} onChange={set('userId')} />
          </Field>
          <Field label="Acción">
            <Select value={filtros.accion} onChange={set('accion')}>
              <option value="">Todas</option>
              <option value="CREAR">Crear</option>
              <option value="MODIFICAR">Modificar</option>
              <option value="CANCELAR">Cancelar</option>
              <option value="ELIMINAR">Eliminar</option>
            </Select>
          </Field>
          <Field label="Recurso">
            <Select value={filtros.recurso} onChange={set('recurso')}>
              <option value="">Todos</option>
              <option value="RESERVA">Reserva</option>
              <option value="HABITACION">Habitación</option>
              <option value="USUARIO">Usuario</option>
            </Select>
          </Field>
          <Field label="Desde">
            <Input type="date" value={filtros.desde} onChange={set('desde')} />
          </Field>
          <Field label="Hasta">
            <Input type="date" value={filtros.hasta} onChange={set('hasta')} />
          </Field>
        </div>
      </Card>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMsg error={error} />
      ) : (
        <Card title="Registros">
          <Table
            headers={['Fecha', 'Autor', 'Acción', 'Recurso', 'ID', 'Detalle']}
            empty="Sin registros"
          >
            {(data || []).map((a) => (
              <tr key={a.id}>
                <td>{fmtDateTime(a.createdAt)}</td>
                <td>{a.user ? `${a.user.username} (${a.user.rol})` : `#${a.userId}`}</td>
                <td>{a.accion}</td>
                <td>{a.recurso}</td>
                <td>{a.recursoId || '—'}</td>
                <td className="max-w-[360px]">
                  <code className="break-words text-xs text-muted">{a.detalle || '—'}</code>
                </td>
              </tr>
            ))}
          </Table>
          <Pager pagination={pagination} onPage={setPage} />
        </Card>
      )}
    </>
  );
}
