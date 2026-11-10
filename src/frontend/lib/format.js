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
