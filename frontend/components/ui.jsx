'use client';

export const ESTADOS_RESERVA = {
  CONFIRMADA: 'CONFIRMADA',
  EN_CURSO: 'EN_CURSO',
  FINALIZADA: 'FINALIZADA',
  CANCELADA: 'CANCELADA',
  NO_SHOW: 'NO_SHOW',
};

export const ESTADOS_PAGO = {
  PENDIENTE: 'PENDIENTE',
  PARCIAL: 'PARCIAL',
  PAGADA: 'PAGADA',
};

export const ROOM_TYPES = {
  SINGLE: 'SINGLE',
  DOBLE: 'DOBLE',
  SUITE: 'SUITE',
};

export const METODOS_PAGO = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];

export const DIAS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export function fmtMoney(n) {
  return `$${Number(n ?? 0).toLocaleString('es-AR')}`;
}

export function fmtDate(iso) {
  if (!iso) return '—';
  const s = String(iso).slice(0, 10);
  const d = new Date(`${s}T00:00:00`);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('es-AR');
}

export function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('es-AR');
}

export function Loading() {
  return <p className="muted">Cargando…</p>;
}

export function ErrorMsg({ error }) {
  if (!error) return null;
  const msg = error?.message || String(error);
  return (
    <div className="error-box" role="alert">
      <strong>{msg}</strong>
      {Array.isArray(error?.details) && error.details.length > 0 && (
        <ul>
          {error.details.map((d, i) => (
            <li key={i}>
              {d.path ? `${d.path.join('.')}: ` : ''}
              {d.message || JSON.stringify(d)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Msg({ children }) {
  if (!children) return null;
  return <div className="ok-box">{children}</div>;
}

export function Card({ title, actions, children }) {
  return (
    <section className="card">
      {(title || actions) && (
        <div className="card-head">
          <h2>{title}</h2>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export function Input(props) {
  return <input {...props} className={`input ${props.className || ''}`} />;
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className="input">
      {children}
    </select>
  );
}

export function Btn({ variant, className, ...props }) {
  return (
    <button {...props} className={`btn ${variant ? `btn-${variant}` : ''} ${className || ''}`} />
  );
}

export function Table({ headers, children, empty = 'Sin registros' }) {
  if (!children || (Array.isArray(children) && children.length === 0)) {
    return <p className="muted">{empty}</p>;
  }
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Badge({ kind }) {
  const labels = {
    CONFIRMADA: 'Confirmada',
    EN_CURSO: 'En curso',
    FINALIZADA: 'Finalizada',
    CANCELADA: 'Cancelada',
    NO_SHOW: 'No show',
    PENDIENTE: 'Pendiente',
    PARCIAL: 'Parcial',
    PAGADA: 'Pagada',
    DISPONIBLE: 'Disponible',
    MANTENIMIENTO: 'Mantenimiento',
    ok: 'OK',
    down: 'Caída',
  };
  if (!kind) return null;
  const cls = String(kind).toLowerCase();
  return <span className={`badge ${cls}`}>{labels[kind] || kind}</span>;
}

export function Pager({ pagination, onPage }) {
  if (!pagination) return null;
  const { page = 1, pageSize = 10, total = 0 } = pagination;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="pager">
      <span className="muted">
        Página {page} de {pages} · {total} registros
      </span>
      <div>
        <Btn disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Anterior
        </Btn>{' '}
        <Btn disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Siguiente
        </Btn>
      </div>
    </div>
  );
}

export function useSearch(source, fromForm) {
  if (!fromForm) return source;
  const q = new URLSearchParams();
  Object.entries(fromForm).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const has = q.toString();
  return has ? `${source}${source.includes('?') ? '&' : '?'}${has}` : source;
}