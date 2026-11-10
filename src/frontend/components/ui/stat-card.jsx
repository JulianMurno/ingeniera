import Link from 'next/link';
import { cn } from '@/lib/cn';

export function StatCard({ href, label, value, icon, className }) {
  const content = (
    <div
      className={cn(
        'flex h-full items-center gap-4 rounded-card border border-border bg-surface p-6 shadow-card transition-all hover:border-primary hover:shadow-elevated',
        className,
      )}
    >
      {icon ? (
        <div className="text-3xl" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <div>
        <div className="text-3xl font-extrabold tracking-tight text-foreground">{value}</div>
        <div className="text-xs font-medium uppercase tracking-[0.05em] text-muted">{label}</div>
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block text-inherit no-underline">
      {content}
    </Link>
  );
}
