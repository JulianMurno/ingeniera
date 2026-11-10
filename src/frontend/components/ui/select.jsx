import { cn } from '@/lib/cn';
import { inputClasses } from './input.jsx';

export function Select({ className, children, ...props }) {
  return (
    <select {...props} className={cn(inputClasses, className)}>
      {children}
    </select>
  );
}
