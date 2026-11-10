export function Loading({ children = 'Cargando…' }) {
  return (
    <p className="text-[13px] text-muted" aria-live="polite">
      {children}
    </p>
  );
}
