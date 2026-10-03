import React from 'react'
import { X, Trash2, ShoppingBag } from 'lucide-react'
import { useCartStore } from '../../stores/cartStore'
import { Button } from '../ui/Button'
import { formatMoney } from '../../lib/format'

export const CartSheet: React.FC = () => {
  const { items, isOpen, setOpen, removeItem, updateQuantity, totalAmount, clearCart } =
    useCartStore()

  if (!isOpen) return null

  const total = totalAmount()

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-overlay)] backdrop-blur-xs transition-opacity"
        onClick={() => setOpen(false)}
      />

      {/* Drawer / Bottom sheet: bottom on mobile, right on desktop */}
      <aside
        className="absolute inset-x-0 bottom-0 max-h-[85vh] md:inset-y-0 md:left-auto md:right-0 md:w-96 md:max-h-full bg-[var(--color-canvas)] text-[var(--color-ink)] rounded-t-[20px] md:rounded-none md:border-l border-[var(--color-hairline)] shadow-[var(--elevation-3)] flex flex-col z-50 animate-in slide-in-from-bottom md:slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-[var(--color-hairline)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[var(--color-primary)]" />
            <h2 className="text-heading-3 font-display font-bold">Your Merch Cart</h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className="p-1.5 rounded-full hover:bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-ink)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 text-[var(--color-muted)]">
              <ShoppingBag className="w-12 h-12 stroke-1 mb-2 opacity-50" />
              <p className="text-body-md font-medium text-[var(--color-ink)]">
                Your cart is empty
              </p>
              <p className="text-caption mt-1">
                Explore club tees, hoodies, and accessories
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}-${item.size}`}
                className="flex items-center justify-between gap-3 p-3 rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-hairline)]"
              >
                <div className="flex-1">
                  <h4 className="text-body-sm-medium text-[var(--color-ink)] leading-snug">
                    {item.productName}
                  </h4>
                  <div className="flex items-center gap-2 text-caption text-[var(--color-muted)] mt-0.5">
                    <span>Size: {item.size}</span>
                    <span>•</span>
                    <span className="font-semibold text-[var(--color-ink)]">
                      {formatMoney(item.unitPrice)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-[var(--color-hairline-strong)] rounded-md bg-[var(--color-canvas)]">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.productId, item.size, item.quantity - 1)
                      }
                      className="px-2 py-0.5 text-caption font-bold hover:bg-[var(--color-surface)] cursor-pointer"
                    >
                      −
                    </button>
                    <span className="px-2 text-caption font-mono font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.productId, item.size, item.quantity + 1)
                      }
                      className="px-2 py-0.5 text-caption font-bold hover:bg-[var(--color-surface)] cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.productId, item.size)}
                    aria-label="Remove item"
                    className="p-1.5 text-[var(--color-error)] hover:bg-[var(--color-error-tint)] rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Bar */}
        {items.length > 0 && (
          <div className="p-4 md:p-6 border-t border-[var(--color-hairline)] bg-[var(--color-surface)] space-y-3">
            <div className="flex justify-between items-center text-body-md font-semibold text-[var(--color-ink)]">
              <span>Total:</span>
              <span className="text-money-lg font-bold">{formatMoney(total)}</span>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                alert(`Proceeding to checkout with total: ${formatMoney(total)}`)
                clearCart()
                setOpen(false)
              }}
            >
              Pay {formatMoney(total)}
            </Button>
          </div>
        )}
      </aside>
    </div>
  )
}
