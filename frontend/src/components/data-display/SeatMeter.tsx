import React from 'react'
import { formatSeatCount } from '../../lib/format'
import { cn } from '../../lib/cn'

export interface SeatMeterProps {
  totalCapacity: number
  registeredCount: number
  showLabel?: boolean
  className?: string
}

export const SeatMeter: React.FC<SeatMeterProps> = ({
  totalCapacity,
  registeredCount,
  showLabel = true,
  className,
}) => {
  const remaining = Math.max(0, totalCapacity - registeredCount)
  const percentFilled = Math.min(100, Math.round((registeredCount / totalCapacity) * 100))
  const isLow = remaining > 0 && remaining / totalCapacity <= 0.1

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-caption">
          <span
            className={cn(
              'font-medium',
              isLow ? 'text-[var(--color-warning)] font-semibold' : 'text-[var(--color-body)]'
            )}
          >
            {formatSeatCount(remaining)}
          </span>
          <span className="text-[var(--color-muted)] font-mono text-[12px]">
            {registeredCount}/{totalCapacity}
          </span>
        </div>
      )}
      <div className="w-full h-2 rounded-full bg-[var(--color-surface-sunken)] overflow-hidden">
        <div
          style={{ width: `${percentFilled}%` }}
          className={cn(
            'h-full rounded-full transition-all duration-300',
            isLow
              ? 'bg-[var(--color-warning)]'
              : remaining === 0
              ? 'bg-[var(--color-muted)]'
              : 'bg-[var(--color-primary)]'
          )}
        />
      </div>
    </div>
  )
}
