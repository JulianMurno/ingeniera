import { cn } from '@/lib/cn';

export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <h1 className="mb-0 font-display text-3xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 mb-0 text-[13px] text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
