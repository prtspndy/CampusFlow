import React from 'react'
import { cn } from '../../lib/cn'

export interface BaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: 'level-0' | 'level-1' | 'level-2' | 'level-3'
}

export const BaseCard: React.FC<BaseCardProps> = ({
  elevation = 'level-0',
  className,
  children,
  ...props
}) => {
  const elevationStyles = {
    'level-0': 'shadow-none',
    'level-1': 'shadow-[var(--elevation-1)]',
    'level-2': 'shadow-[var(--elevation-2)]',
    'level-3': 'shadow-[var(--elevation-3)]',
  }

  return (
    <div
      className={cn(
        'bg-[var(--color-canvas)] text-[var(--color-body)] rounded-[14px] p-6 border border-[var(--color-hairline)]',
        elevationStyles[elevation],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
