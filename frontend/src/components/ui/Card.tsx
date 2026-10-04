import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ className, elevated = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border shadow-sm transition-colors',
        elevated
          ? 'bg-[#1c2b3c] border-[#273647] light:bg-[#F1F5F9] light:border-[#E2E8F0]'
          : 'bg-[#122131] border-[#273647]/60 light:bg-white light:border-[#E2E8F0]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'px-5 py-4 border-b border-[#273647]/50 flex items-center justify-between gap-4 light:border-[#E2E8F0]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-sm font-headline font-semibold text-[#d4e4fa] tracking-tight light:text-slate-900', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'px-5 py-3.5 border-t border-[#273647]/50 flex items-center justify-between gap-3 bg-[#0d1c2d]/40 light:border-[#E2E8F0] light:bg-slate-50',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
