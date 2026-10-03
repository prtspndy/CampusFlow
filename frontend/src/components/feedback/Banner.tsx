import React from 'react'
import { Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface BannerProps {
  variant?: 'info' | 'warning'
  title?: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  onDismiss?: () => void
  className?: string
}

export const Banner: React.FC<BannerProps> = ({
  variant = 'info',
  title,
  message,
  action,
  onDismiss,
  className,
}) => {
  const isWarning = variant === 'warning'

  return (
    <div
      role="alert"
      className={cn(
        'w-full flex items-start justify-between gap-3 p-3.5 rounded-[10px] text-body-sm-medium transition-colors',
        isWarning
          ? 'bg-[var(--color-warning-tint)] text-[var(--color-warning-deep)] border border-[var(--color-warning-deep)]/15'
          : 'bg-[var(--color-primary-tint)] text-[var(--color-primary-deep)] border border-[var(--color-primary-deep)]/15',
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        {isWarning ? (
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        ) : (
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
        )}
        <div className="flex flex-col">
          {title && <span className="font-semibold text-body-md leading-tight">{title}</span>}
          <span className="text-body-sm opacity-95">{message}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="px-3 py-1 text-caption font-semibold rounded-[6px] bg-white/70 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50 transition-colors cursor-pointer"
          >
            {action.label}
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss banner"
            className="p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
