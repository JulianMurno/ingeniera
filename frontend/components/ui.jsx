'use client';

export function Btn({ children, variant, size, className = '', ...props }) {
  const cls = ['btn', variant ? `btn-${variant}` : '', size ? `btn-${size}` : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={cls} {...props}>
      {children}
    </button>
  );
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-head">
          {title && <h2>{title}</h2>}
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Field({ label, children, className = '' }) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export function Input(props) {
  return <input className="input" {...props} />;
}

export function Select(props) {
  return <select className="select" {...props} />;
}

export function ErrorMsg({ error }) {
  if (!error) return null;
  const details = error.details;
  return (
    <div className="error-box">
      {error.message}
      {Array.isArray(details) && details.length > 0 && (
        <ul>
          {details.map((d, i) => (
            <li key={i}>{d.message || String(d)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function OkMsg({ message }) {
  if (!message) return null;
  return <div className="ok-box">{message}</div>;
}

export function Loading() {
  return <p className="muted">Cargando…</p>;
}

export function Badge({ children, kind }) {
  const cls = ['badge', kind ? kind : String(children || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')]
    .filter(Boolean)
    .join(' ');
  return <span className={cls}>{children}</span>;
}

export function Table({ headers, empty, children }) {
  if (!children || (Array.isArray(children) && children.length === 0)) {
    return <p className="muted">{empty || 'Sin datos'}</p>;
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

export function Empty({ children }) {
  return <p className="muted">{children || 'Sin datos'}</p>;
}