import React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-dark-elevated/70 light:bg-light-elevated/90',
        className,
      )}
      {...props}
    />
  );
}
