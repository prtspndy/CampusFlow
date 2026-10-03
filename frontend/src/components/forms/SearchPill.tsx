import React from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface SearchPillProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
}

export const SearchPill = React.forwardRef<HTMLInputElement, SearchPillProps>(
  ({ className, value, onClear, onChange, placeholder = 'Search...', ...props }, ref) => {
    return (
      <div className={cn('relative flex items-center w-full', className)}>
        <Search className="absolute left-4 w-[18px] h-[18px] text-[var(--color-muted)] pointer-events-none" />
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full h-12 pl-11 pr-10 text-body-md rounded-full bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-hairline)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--elevation-focus-ring)] transition-all [&::-webkit-search-cancel-button]:appearance-none"
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3.5 p-1 rounded-full text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }
)

SearchPill.displayName = 'SearchPill'
