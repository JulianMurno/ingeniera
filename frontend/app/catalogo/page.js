'use client';

import { useState } from 'react';
import { api, isAdmin } from '@/lib/api';
import {
  Badge,
  Btn,
  CATEGORIA_LABEL,
  Card,
  ErrorMsg,
  Field,
  Loading,
  Pager,
  Select,
  Table,
  UNIDAD_LABEL,
  fmtMoney,
} from '@/components/ui';
import { useData } from '@/lib/useData';
import FormExtra from '@/components/FormExtra';

export default function CatalogoPage() {
  const admin = isAdmin();
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({ categoria: '', activo: '' });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [actionErr, setActionErr] = useState(null);

  const params = new URLSearchParams({ page, pageSize: 20 });
  if (filtros.categoria) params.set('categoria', filtros.categoria);
  // El personal solo ve servicios activos: el filtro de estado es para el administrador
  if (admin && filtros.activo) params.set('activo', filtros.activo);
  const { data, pagination, loading, error, reload } = useData(
    `/api/v1/extras?${params.toString()}`,
  );

  const setFiltro = (k) => (e) => {
    setFiltros((f) => ({ ...f, [k]: e.target.value }));
    setPage(1);
  };

  async function darDeBaja(extra) {
    if (!window.confirm(`Dar de baja "${extra.nombre}"? Los cargos ya registrados se conservan.`)) {
      return;
    }
    setActionErr(null);
    try {
      await api(`/api/v1/extras/${extra.id}`, { method: 'DELETE' });
      reload();
    } catch (e) {
      setActionErr(e);
    }
  }

  return (
    <>
      <div className="spread">
        <h1>Servicios adicionales</h1>
        {admin && (
          <Btn variant="primary" onClick={() => { setCreating(true); setEditing(null); }}>
            + Nuevo servicio
          </Btn>
        )}
      </div>

      {admin && creating && (
        <Card title="Nuevo servicio">
          <FormExtra
            onDone={() => { setCreating(false); reload(); }}
            onCancel={() => setCreating(false)}
          />
        </Card>
      )}
      {admin && editing && (
        <Card title={`Editar ${editing.codigo}`}>
          <FormExtra
            initial={editing}
            onDone={() => { setEditing(null); reload(); }}
            onCancel={() => setEditing(null)}
          />
        </Card>
      )}

      <Card title="Filtros">
        <div className="row">
          <Field label="Categoría">
            <Select value={filtros.categoria} onChange={setFiltro('categoria')}>
              <option value="">Todas</option>
              {Object.entries(CATEGORIA_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          {admin && (
            <Field label="Estado">
              <Select value={filtros.activo} onChange={setFiltro('activo')}>
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </Select>
            </Field>
          )}
        </div>
      </Card>

      <ErrorMsg error={actionErr} />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMsg error={error} />
      ) : (
        <Card title="Catálogo">
          <Table
            headers={['Código', 'Nombre', 'Categoría', 'Precio', 'Unidad', 'Estado', '']}
            empty="No hay servicios cargados"
          >
            {(data || []).map((extra) => (
              <tr key={extra.id}>
                <td>{extra.codigo}</td>
                <td>
                  {extra.nombre}
                  {extra.descripcion && <div className="muted">{extra.descripcion}</div>}
                </td>
                <td>{CATEGORIA_LABEL[extra.categoria] || extra.categoria}</td>
                <td className="money">{fmtMoney(extra.precio)}</td>
                <td>{UNIDAD_LABEL[extra.unidad] || extra.unidad}</td>
                <td>
                  <Badge kind={extra.activo ? 'ACTIVO' : 'INACTIVO'} />
                </td>
                <td className="spread">
                  {admin && (
                    <>
                      <Btn variant="sm" onClick={() => { setEditing(extra); setCreating(false); }}>
                        Editar
                      </Btn>
                      {extra.activo && (
                        <Btn variant="sm btn-danger" onClick={() => darDeBaja(extra)}>
                          Dar de baja
                        </Btn>
                      )}
                    </>
                  )}
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
