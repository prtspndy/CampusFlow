import React from 'react'
import { CheckCircle2, Clock, AlertTriangle, XCircle, Info } from 'lucide-react'
import { cn } from '../../lib/cn'

export type StatusVariant = 'active' | 'expiring' | 'expired' | 'neutral' | 'info'

export interface StatusBadgeProps {
  variant: StatusVariant
  label: string
  showIcon?: boolean
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  label,
  showIcon = true,
  className,
}) => {
  const styles = {
    active: {
      badge: 'bg-[var(--color-success-tint)] text-[var(--color-success-deep)]',
      icon: CheckCircle2,
    },
    expiring: {
      badge: 'bg-[var(--color-warning-tint)] text-[var(--color-warning-deep)]',
      icon: AlertTriangle,
    },
    expired: {
      badge: 'bg-[var(--color-error-tint)] text-[var(--color-error-deep)]',
      icon: XCircle,
    },
    neutral: {
      badge: 'bg-[var(--color-surface-sunken)] text-[var(--color-body)]',
      icon: Clock,
    },
    info: {
      badge: 'bg-[var(--color-primary-tint)] text-[var(--color-primary-deep)]',
      icon: Info,
    },
  }

  const current = styles[variant]
  const IconComponent = current.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-semibold select-none',
        current.badge,
        className
      )}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span>{label}</span>
    </span>
  )
}
