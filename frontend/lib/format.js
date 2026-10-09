const moneyFmt = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export function fmtMoney(value) {
  if (value === null || value === undefined) return '—';
  return moneyFmt.format(value);
}

export function fmtDate(value) {
  if (!value) return '—';
  const iso = String(value).slice(0, 10);
  return iso;
}

export function fmtDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function fmtEstado(estado) {
  return String(estado || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export const CATEGORIA_LABEL = {
  ALIMENTOS: 'Alimentos',
  LAVANDERIA: 'Lavandería',
  TRANSPORTE: 'Transporte',
  SERVICIOS: 'Servicios',
  OTROS: 'Otros',
};

export const UNIDAD_LABEL = {
  NOCHE: 'Noche',
  POR_UNIDAD: 'Por unidad',
  DIA: 'Día',
  ESTANCIA: 'Estancia',
};