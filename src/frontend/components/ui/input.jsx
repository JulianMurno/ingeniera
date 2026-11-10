import { cn } from '@/lib/cn';

export const inputClasses =
  'w-full rounded-control border border-border bg-surface px-3 py-2.5 font-sans text-sm text-foreground transition-colors placeholder:text-muted hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger';

export function Input({ className, ...props }) {
  return <input {...props} className={cn(inputClasses, className)} />;
}
