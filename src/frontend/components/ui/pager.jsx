import { Btn } from './button.jsx';

export function Pager({ pagination, onPage }) {
  if (!pagination) return null;
  const { page = 1, pageSize = 10, total = 0 } = pagination;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-4">
      <span className="text-[13px] text-muted">
        Página {page} de {pages} · {total} registros
      </span>
      <div className="flex gap-2">
        <Btn size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Anterior
        </Btn>
        <Btn size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Siguiente
        </Btn>
      </div>
    </div>
  );
}
