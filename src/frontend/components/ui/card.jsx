import { cn } from '@/lib/cn';

export function Card({ title, actions, className, children }) {
  return (
    <section
      className={cn(
        'rounded-card border border-border bg-surface p-6 shadow-card transition-shadow hover:shadow-card-hover',
        className,
      )}
    >
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border-soft pb-4">
          {title ? (
            <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
          ) : (
            <span />
          )}
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
