import { cn } from '@/lib/cn';

const TONE_CLASSES = {
  error: 'border-danger/30 border-l-danger bg-danger-soft text-danger-strong',
  success: 'border-success/30 border-l-success bg-success-soft text-success-strong',
  warning: 'border-warning/30 border-l-warning bg-warning-soft text-warning-strong',
  info: 'border-border border-l-primary bg-surface text-foreground',
};

export function Alert({ tone = 'info', title, className, children, ...props }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'mb-4 rounded-card border border-l-4 px-4 py-3 text-sm shadow-card',
        TONE_CLASSES[tone] ?? TONE_CLASSES.info,
        className,
      )}
      {...props}
    >
      {title ? <strong className="block">{title}</strong> : null}
      {children}
    </div>
  );
}

export function ErrorMsg({ error }) {
  if (!error) return null;
  const msg = error?.message || String(error);
  return (
    <Alert tone="error">
      <strong>{msg}</strong>
      {Array.isArray(error?.details) && error.details.length > 0 && (
        <ul className="mt-2 list-disc pl-5">
          {error.details.map((d, i) => (
            <li key={i}>
              {d.path ? `${Array.isArray(d.path) ? d.path.join('.') : d.path}: ` : ''}
              {d.message || JSON.stringify(d)}
            </li>
          ))}
        </ul>
      )}
    </Alert>
  );
}

export function Msg({ children }) {
  if (!children) return null;
  return <Alert tone="success">{children}</Alert>;
}
