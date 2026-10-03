import React from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface MemberPriceBadgeProps {
  className?: string
  text?: string
}

export const MemberPriceBadge: React.FC<MemberPriceBadgeProps> = ({
  className,
  text = 'Member price',
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-semibold bg-[var(--color-primary-tint)] text-[var(--color-primary-deep)] select-none',
        className
      )}
    >
      <Sparkles className="w-3 h-3 shrink-0" />
      <span>{text}</span>
    </span>
  )
}
