import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { useEscapeKey } from '../../hooks/useEscapeKey'

export interface DropdownMenuItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  /** When set, the item behaves as a radio option and shows a check mark. */
  selected?: boolean
  /** Styles the item for a destructive or sign-out action. */
  tone?: 'default' | 'danger'
  onSelect: () => void
}

export interface DropdownMenuProps {
  /** Rendered inside the trigger button. */
  trigger: React.ReactNode
  triggerLabel: string
  triggerClassName?: string
  heading?: string
  items: DropdownMenuItem[]
  align?: 'left' | 'right'
  widthClassName?: string
}

/**
 * Click-to-open menu with the keyboard behaviour people expect:
 * Escape closes, arrow keys move, focus returns to the trigger, and the
 * trigger announces its expanded state.
 */
export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  triggerLabel,
  triggerClassName,
  heading,
  items,
  align = 'right',
  widthClassName = 'w-48',
}) => {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  useEscapeKey(open, close)

  useEffect(() => {
    if (!open) return
    const first = listRef.current?.querySelector<HTMLButtonElement>('[role^="menuitem"]')
    first?.focus()
  }, [open])

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const buttons = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]') ?? [],
    )
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const next =
      event.key === 'ArrowDown'
        ? buttons[(index + 1) % buttons.length]
        : buttons[(index - 1 + buttons.length) % buttons.length]
    next?.focus()
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={triggerClassName}
      >
        {trigger}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            ref={listRef}
            id={menuId}
            role="menu"
            aria-label={heading ?? triggerLabel}
            onKeyDown={handleListKeyDown}
            className={cn(
              'absolute mt-2 rounded-[12px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] shadow-[var(--elevation-2)] p-1 z-50 animate-in zoom-in-95 duration-100 origin-top',
              align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
              widthClassName,
            )}
          >
            {heading && (
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                {heading}
              </div>
            )}
            {items.map((item) => {
              const isRadio = item.selected !== undefined
              return (
                <button
                  key={item.id}
                  type="button"
                  role={isRadio ? 'menuitemradio' : 'menuitem'}
                  aria-checked={isRadio ? item.selected : undefined}
                  onClick={() => {
                    item.onSelect()
                    close()
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 text-left px-3 py-2 text-body-sm font-medium rounded-[8px] transition-colors cursor-pointer',
                    item.selected
                      ? 'bg-[var(--color-primary-tint)] text-[var(--color-primary-deep)]'
                      : item.tone === 'danger'
                        ? 'text-[var(--color-error)] hover:bg-[var(--color-error-tint)]'
                        : 'text-[var(--color-ink)] hover:bg-[var(--color-surface)]',
                  )}
                >
                  {item.icon && (
                    <item.icon
                      className={cn(
                        'w-4 h-4',
                        item.tone === 'danger' ? 'text-current' : 'text-[var(--color-muted)]',
                      )}
                    />
                  )}
                  <span className="flex-1">{item.label}</span>
                  {item.selected && (
                    <span aria-hidden="true" className="text-[var(--color-primary)]">
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
