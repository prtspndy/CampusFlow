import { cn } from '../../lib/cn'

export interface FilterChipOption<T extends string = string> {
  value: T
  label: string
  count?: number
}

export interface FilterChipsProps<T extends string = string> {
  options: FilterChipOption<T>[]
  selected: T
  onChange: (value: T) => void
  className?: string
}

export function FilterChips<T extends string = string>({
  options,
  selected,
  onChange,
  className,
}: FilterChipsProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn('flex items-center gap-2 overflow-x-auto py-1 scrollbar-none', className)}
    >
      {options.map((option) => {
        const isActive = selected === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-body-sm-medium cursor-pointer transition-colors shrink-0 select-none',
              // Invisible hit area extension for minimum 44px touch target per DESIGN.md
              'before:absolute before:inset-x-0 before:-inset-y-1 before:content-[""]',
              isActive
                ? 'bg-[var(--color-ink)] text-[var(--color-on-ink)] border border-[var(--color-ink)]'
                : 'bg-[var(--color-canvas)] text-[var(--color-body)] border border-[var(--color-hairline-strong)] hover:bg-[var(--color-surface)]'
            )}
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={cn(
                  'text-caption font-semibold px-1.5 py-0.2 rounded-full',
                  isActive
                    ? 'bg-[var(--color-on-ink)]/20 text-[var(--color-on-ink)]'
                    : 'bg-[var(--color-surface-sunken)] text-[var(--color-muted)]'
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
