import React, { useCallback, useEffect, useRef, useState } from 'react'
import { X, Trash2, ShoppingBag, CheckCircle2, Minus, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCartStore } from '../../stores/cartStore'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../ui/Button'
import { formatMoney } from '../../lib/format'
import { api, isApiError } from '../../lib/api'
import { useBodyScrollLock, useEscapeKey } from '../../hooks/useEscapeKey'

export const CartSheet: React.FC = () => {
  const items = useCartStore((state) => state.items)
  const isOpen = useCartStore((state) => state.isOpen)
  const setOpen = useCartStore((state) => state.setOpen)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const clearCart = useCartStore((state) => state.clearCart)
  const user = useAuthStore((state) => state.user)

  const [placedOrder, setPlacedOrder] = useState<{ total: number; count: number; orderNumber: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setPlacedOrder(null)
  }, [setOpen])

  useEscapeKey(isOpen, close)
  useBodyScrollLock(isOpen)

  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)

  const handleCheckout = async () => {
    if (!user) {
      setCheckoutError('Sign in before placing a pickup order.')
      return
    }
    setSubmitting(true)
    setCheckoutError(null)
    try {
      const result = await api.post<{ order: { orderNumber: string; totalAmount: number } }>('/orders', {
        idempotencyKey,
        items: items.map((item) => ({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
        })),
      })
      setPlacedOrder({
        total: result.order.totalAmount,
        count,
        orderNumber: result.order.orderNumber,
      })
      clearCart()
    } catch (error) {
      setCheckoutError(isApiError(error) ? error.message : 'The order could not be placed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-[var(--color-overlay)] backdrop-blur-xs animate-in fade-in duration-150"
        aria-hidden="true"
        onClick={close}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-sheet-title"
        className="absolute inset-x-0 bottom-0 max-h-[85vh] md:inset-y-0 md:left-auto md:right-0 md:w-96 md:max-h-full bg-[var(--color-canvas)] text-[var(--color-ink)] rounded-t-[20px] md:rounded-none md:border-l border-[var(--color-hairline)] shadow-[var(--elevation-3)] flex flex-col z-50 animate-in slide-in-from-bottom md:slide-in-from-right duration-200 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="p-4 md:p-6 border-b border-[var(--color-hairline)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[var(--color-primary)]" aria-hidden="true" />
            <h2 id="cart-sheet-title" className="text-heading-3 font-display font-bold">
              Your Merch Cart
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="p-1.5 rounded-full hover:bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-ink)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {placedOrder ? (
            <div
              role="status"
              className="flex flex-col items-center justify-center text-center py-10 animate-in rise-in duration-300"
            >
              <div className="w-14 h-14 rounded-full bg-[var(--color-success-tint)] text-[var(--color-success)] flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
                Order placed
              </p>
              <p className="text-body-sm text-[var(--color-muted)] mt-1 max-w-xs">
                {placedOrder.count} {placedOrder.count === 1 ? 'item' : 'items'} for{' '}
                <span className="font-semibold text-[var(--color-ink)]">
                  {formatMoney(placedOrder.total)}
                </span>
                . Order {placedOrder.orderNumber}. Pick up at the club table.
              </p>
              <Link to="/shop" onClick={close} className="mt-6">
                <Button variant="secondary">Keep browsing</Button>
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 text-[var(--color-muted)]">
              <ShoppingBag className="w-12 h-12 stroke-1 mb-2 opacity-50" aria-hidden="true" />
              <p className="text-body-md font-medium text-[var(--color-ink)]">Your cart is empty</p>
              <p className="text-caption mt-1">Explore club tees, hoodies, and accessories</p>
              <Link to="/shop" onClick={close} className="mt-5">
                <Button variant="secondary" size="sm">
                  Browse the store
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="space-y-4" aria-label="Cart items">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.size}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-hairline)]"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-body-sm-medium text-[var(--color-ink)] leading-snug truncate">
                      {item.productName}
                    </h3>
                    <div className="flex items-center gap-2 text-caption text-[var(--color-muted)] mt-0.5">
                      <span>Size {item.size}</span>
                      <span aria-hidden="true">•</span>
                      <span className="font-semibold text-[var(--color-ink)]">
                        {formatMoney(item.unitPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      role="group"
                      aria-label={`Quantity for ${item.productName}, size ${item.size}`}
                      className="flex items-center border border-[var(--color-hairline-strong)] rounded-md bg-[var(--color-canvas)]"
                    >
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                        className="h-9 w-9 flex items-center justify-center hover:bg-[var(--color-surface)] cursor-pointer rounded-l-md"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span
                        aria-live="polite"
                        className="w-7 text-center text-caption font-mono font-semibold"
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                        className="h-9 w-9 flex items-center justify-center hover:bg-[var(--color-surface)] cursor-pointer rounded-r-md"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, item.size)}
                      aria-label={`Remove ${item.productName}`}
                      className="h-9 w-9 flex items-center justify-center text-[var(--color-error)] hover:bg-[var(--color-error-tint)] rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!placedOrder && items.length > 0 && (
          <div className="p-4 md:p-6 border-t border-[var(--color-hairline)] bg-[var(--color-surface)] space-y-3">
            <div className="flex justify-between items-center text-body-md font-semibold text-[var(--color-ink)]">
              <span>
                Total <span className="text-caption text-[var(--color-muted)]">({count} items)</span>
              </span>
              <span className="text-money-lg font-bold">{formatMoney(total)}</span>
            </div>

            {checkoutError && (
              <p className="text-caption text-[var(--color-error)]" role="alert">
                {checkoutError}{' '}
                {!user && (
                  <Link to="/login" className="underline">
                    Sign in
                  </Link>
                )}
              </p>
            )}
            <Button variant="primary" fullWidth onClick={() => void handleCheckout()} disabled={submitting}>
              {submitting ? 'Placing order…' : `Place pickup order ${formatMoney(total)}`}
            </Button>
            <p className="text-caption text-[var(--color-muted)]">
              Stock is reserved now. Pay when you collect the order. The server sets the final total.
            </p>
          </div>
        )}
      </aside>
    </div>
  )
}
