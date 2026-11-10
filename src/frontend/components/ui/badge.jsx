import { cn } from '@/lib/cn';

const BASE =
  'inline-flex items-center whitespace-nowrap rounded-pill px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.05em]';

const TONE_CLASSES = {
  CONFIRMADA: 'bg-success-soft text-success-strong',
  PAGADA: 'bg-success-soft text-success-strong',
  DISPONIBLE: 'bg-success-soft text-success-strong',
  ACTIVO: 'bg-success-soft text-success-strong',
  ok: 'bg-success-soft text-success-strong',
  EN_CURSO: 'bg-primary-soft text-primary-dark',
  FINALIZADA: 'bg-info-soft text-info-strong',
  CANCELADA: 'bg-danger-soft text-danger-strong',
  down: 'bg-danger-soft text-danger-strong',
  NO_SHOW: 'bg-warning-soft text-warning-strong',
  PARCIAL: 'bg-warning-soft text-warning-strong',
  PENDIENTE: 'bg-neutral-soft text-neutral-strong',
  MANTENIMIENTO: 'bg-accent-soft text-accent',
  INACTIVO: 'bg-accent-soft text-accent',
};

const LABELS = {
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
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  ok: 'OK',
  down: 'Caída',
};

export function Badge({ kind, className }) {
  if (!kind) return null;
  const key = String(kind);
  return (
    <span className={cn(BASE, TONE_CLASSES[key] ?? TONE_CLASSES.PENDIENTE, className)}>
      {LABELS[key] || key}
    </span>
  );
}

export const badgeToneClasses = TONE_CLASSES;
