import { cn } from '@/lib/cn';

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-control border font-sans font-medium leading-tight no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50';

const VARIANT_CLASSES = {
  primary:
    'border-primary bg-primary text-primary-contrast shadow-card hover:border-primary-dark hover:bg-primary-dark',
  secondary:
    'border-border bg-surface text-foreground hover:border-border-strong hover:bg-background-alt',
  danger:
    'border-danger bg-danger text-primary-contrast hover:border-danger-strong hover:bg-danger-strong',
  ok: 'border-success-strong bg-success-soft text-success-strong hover:border-success hover:bg-success-soft',
  warn: 'border-warning-strong bg-warning-soft text-warning-strong hover:border-warning hover:bg-warning-soft',
  ghost: 'border-transparent bg-transparent text-primary hover:bg-primary-soft',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-[13px]',
  md: 'px-4 py-2.5 text-sm',
};

export function buttonVariants({ variant = 'secondary', size = 'md', className } = {}) {
  return cn(
    BASE,
    VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.secondary,
    SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
    className,
  );
}

export function Button({ variant, size, className, ...props }) {
  return <button {...props} className={buttonVariants({ variant, size, className })} />;
}

export const Btn = Button;
