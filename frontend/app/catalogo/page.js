'use client';

import { useState } from 'react';
import { getToken, api, isAdmin } from '@/lib/api';
import { useData } from '@/hooks/useData';
import { CATEGORIA_LABEL, UNIDAD_LABEL, fmtMoney } from '@/lib/format';
import { Badge, Btn, Card, ErrorMsg, Field, Loading, Table } from '@/components/ui';
import FormExtra from '@/components/FormExtra';

const PAGE_SIZE = 20;

export default function CatalogoPage() {
  const admin = isAdmin();
  const [page, setPage] = useState(1);
  const [filtro, setFiltro] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);

  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('pageSize', String(PAGE_SIZE));
  if (admin && filtro) qs.set('activo', filtro);

  const { data, pagination, loading, error: fetchError, reload } = useData(`/extras?${qs}`);
  const err = error || fetchError;

  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / PAGE_SIZE)) : 1;

  if (!getToken()) {
    return (
      <Card title="Inicia sesión">
        <p className="muted">
          Para gestionar el catálogo de servicios usá una sesión del encabezado. El alta, edición y
          baja son exclusivas de <code>ADMINISTRADOR</code>.
        </p>
      </Card>
    );
  }

  async function onDeactivate(extra) {
    if (!window.confirm(`¿Dar de baja "${extra.nombre}"? Los cargos ya registrados se conservan.`)) {
      return;
    }
    try {
      await api(`/extras/${extra.id}`, { method: 'DELETE' });
      reload();
    } catch (e) {
      setError(e);
    }
  }

  return (
    <>
      <div className="spread">
        <h1>Catálogo de servicios adicionales</h1>
        {admin && (
          <Btn variant="primary" onClick={() => { setEditing(null); setShowForm((s) => !s); }}>
            {showForm && !editing ? 'Ocultar formulario' : 'Nuevo servicio'}
          </Btn>
        )}
      </div>

      <ErrorMsg error={err} />

      {admin && showForm && !editing && (
        <Card>
          <FormExtra onDone={reload} onCancel={() => setShowForm(false)} />
        </Card>
      )}

      {admin && editing && (
        <Card>
          <FormExtra
            initial={editing}
            onDone={() => { setEditing(null); setShowForm(false); reload(); }}
            onCancel={() => setEditing(null)}
          />
        </Card>
      )}

      <Card>
        {admin && (
          <div className="row" style={{ marginBottom: 12 }}>
            <Field label="Estado">
              <select
                className="select"
                value={filtro}
                onChange={(e) => { setFiltro(e.target.value); setPage(1); }}
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </Field>
            <Btn onClick={reload}>Refrescar</Btn>
          </div>
        )}
        {loading ? (
          <Loading />
        ) : (
          <>
            <Table
              headers={['Código', 'Nombre', 'Categoría', 'Precio', 'Unidad', 'Estado', 'Acciones']}
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
                    <Badge>{extra.activo ? 'activo' : 'inactivo'}</Badge>
                  </td>
                  <td>
                    <div className="card-actions">
                      {admin && (
                        <>
                          <Btn size="sm" onClick={() => setEditing(extra)}>
                            Editar
                          </Btn>
                          {extra.activo && (
                            <Btn size="sm" variant="danger" onClick={() => onDeactivate(extra)}>
                              Dar de baja
                            </Btn>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            {pagination && (
              <div className="pager">
                <span className="muted">
                  Página {pagination.page} de {totalPages} · {pagination.total} servicios
                </span>
                <div className="card-actions">
                  <Btn size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Anterior
                  </Btn>
                  <Btn size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Siguiente
                  </Btn>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </>
  );
}