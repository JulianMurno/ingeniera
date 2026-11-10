import { cn } from '@/lib/cn';

export function EmptyState({ className, children = 'Sin registros' }) {
  return (
    <p
      className={cn(
        'rounded-control border border-dashed border-border px-4 py-6 text-sm text-muted',
        className,
      )}
    >
      {children}
    </p>
  );
}
