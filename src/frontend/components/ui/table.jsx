import { cn } from '@/lib/cn';
import { EmptyState } from './empty-state.jsx';

const TABLE_CLASSES =
  'w-full border-collapse text-sm [&_td]:border-b [&_td]:border-border-soft [&_td]:px-4 [&_td]:py-3 [&_td]:align-middle [&_tr:last-child_td]:border-b-0';

export function Table({ headers, children, empty = 'Sin registros', className }) {
  const rows = Array.isArray(children) ? children.filter(Boolean) : children;

  if (!rows || (Array.isArray(rows) && rows.length === 0)) {
    return <EmptyState>{empty}</EmptyState>;
  }

  return (
    <div className={cn('overflow-x-auto rounded-control border border-border-soft', className)}>
      <table className={TABLE_CLASSES}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap border-b border-border-soft bg-surface-strong px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr:hover]:bg-background">{children}</tbody>
      </table>
    </div>
  );
}
