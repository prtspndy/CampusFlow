import React from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface StatTileProps {
  label: string
  value: string
  delta?: string
  deltaType?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
  isNegativeBalance?: boolean
  className?: string
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  delta,
  deltaType = 'neutral',
  icon,
  isNegativeBalance = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-[var(--color-surface)] text-[var(--color-ink)] rounded-[14px] p-5 border border-[var(--color-hairline)] flex flex-col justify-between transition-colors',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-micro-uppercase text-[var(--color-muted)] font-bold tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="text-[var(--color-muted)] p-1 rounded-md bg-[var(--color-canvas)]">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-1">
        <span
          className={cn(
            'text-money-lg font-bold block tracking-tight',
            isNegativeBalance
              ? 'text-[var(--color-money-negative)]'
              : 'text-[var(--color-ink)]'
          )}
        >
          {value}
        </span>

        {delta && (
          <div className="flex items-center gap-1 mt-1 text-caption font-medium">
            {deltaType === 'positive' && (
              <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-money-in)]" />
            )}
            {deltaType === 'negative' && (
              <ArrowDownRight className="w-3.5 h-3.5 text-[var(--color-money-negative)]" />
            )}
            <span
              className={cn(
                deltaType === 'positive' && 'text-[var(--color-money-in)]',
                deltaType === 'negative' && 'text-[var(--color-money-negative)]',
                deltaType === 'neutral' && 'text-[var(--color-muted)]'
              )}
            >
              {delta}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
