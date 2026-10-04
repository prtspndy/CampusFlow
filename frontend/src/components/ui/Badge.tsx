import React from 'react';
import { cn } from '../../lib/utils';
import { getStatusStyle } from '../../lib/formatters';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  status?: string;
  children?: React.ReactNode;
}

export function Badge({ variant, status, children, className, ...props }: BadgeProps) {
  let resolvedVariant = variant;
  let label = children;

  if (status) {
    const style = getStatusStyle(status);
    resolvedVariant = style.color;
    label = label || style.label;
  }

  const variantStyles = {
    success:
      'bg-[rgba(16,185,129,0.12)] text-[#34D399] border-[rgba(16,185,129,0.25)]',
    warning:
      'bg-[rgba(245,158,11,0.12)] text-[#FBBF24] border-[rgba(245,158,11,0.25)]',
    error:
      'bg-[rgba(239,68,68,0.12)] text-[#F87171] border-[rgba(239,68,68,0.25)]',
    info:
      'bg-[rgba(0,71,255,0.12)] text-[#60A5FA] border-[rgba(0,71,255,0.25)]',
    default:
      'bg-dark-elevated text-dark-muted border-dark-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide uppercase',
        variantStyles[resolvedVariant || 'default'],
        className,
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}
