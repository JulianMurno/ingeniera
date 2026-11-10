import { cn } from '@/lib/cn';

export function Field({ label, hint, error, className, children }) {
  return (
    <label className={cn('mb-4 flex min-w-[200px] flex-1 flex-col gap-1.5', className)}>
      <span className="text-[13px] font-semibold text-foreground-soft">{label}</span>
      {children}
      {error ? (
        <span className="text-xs font-medium text-danger-strong" role="alert">
          {error}
        </span>
      ) : null}
      {!error && hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
