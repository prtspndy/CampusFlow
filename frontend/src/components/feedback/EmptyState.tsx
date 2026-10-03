import React from 'react'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-[14px] bg-[var(--color-surface)] border border-[var(--color-hairline)] max-w-lg mx-auto my-6',
        className
      )}
    >
      {icon && (
        <div className="w-14 h-14 rounded-full bg-[var(--color-primary-tint)] text-[var(--color-primary-deep)] flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-heading-3 font-display text-[var(--color-ink)] mb-2 font-bold">
        {title}
      </h3>
      <p className="text-body-sm text-[var(--color-muted)] mb-6 max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
