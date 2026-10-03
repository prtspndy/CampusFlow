import React, { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Check } from 'lucide-react'
import { MOCK_PRODUCTS } from '../../../lib/mockData'
import { Button } from '../../../components/ui/Button'
import { MemberPriceBadge } from '../../../components/badges/MemberPriceBadge'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { useAuthStore } from '../../../stores/authStore'
import { useCartStore } from '../../../stores/cartStore'
import { formatMoney } from '../../../lib/format'
import type { ProductSize } from '../../../types/enums'
import type { Product } from '../../../types/models'
import { cn } from '../../../lib/cn'

/** Prefer M when it is in stock, otherwise the first size that is. */
function pickDefaultSize(product: Product): ProductSize {
  const inStock = product.sizes.filter((s) => s.stock > 0)
  const medium = inStock.find((s) => s.size === 'M')
  return (medium ?? inStock[0] ?? product.sizes[0])?.size ?? 'M'
}

export const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const product = MOCK_PRODUCTS.find((p) => p.id === id)

  if (!product) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Link
          to="/shop"
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Store</span>
        </Link>
        <EmptyState
          icon={<ShoppingBag className="w-6 h-6" />}
          title="Product not found"
          description="This item may have sold out or been removed from the store."
          action={
            <Link to="/shop">
              <Button variant="primary">Browse all merch</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return <ProductDetail product={product} />
}

const ProductDetail: React.FC<{ product: Product }> = ({ product }) => {
  const user = useAuthStore((state) => state.user)
  const addItem = useCartStore((state) => state.addItem)
  const setOpen = useCartStore((state) => state.setOpen)

  const isMember = !!user?.membership && user.membership.status === 'ACTIVE'
  const displayPrice = isMember ? product.memberPrice : product.standardPrice

  const [selectedSize, setSelectedSize] = useState<ProductSize>(() => pickDefaultSize(product))
  const [addedAnimation, setAddedAnimation] = useState(false)
  const addedTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(addedTimer.current), [])

  const currentSizeObj = product.sizes.find((s) => s.size === selectedSize)
  const isCurrentOutOfStock = currentSizeObj ? currentSizeObj.stock <= 0 : false

  const handleAddToCart = () => {
    if (isCurrentOutOfStock) return

    addItem({
      productId: product.id,
      productName: product.name,
      size: selectedSize,
      quantity: 1,
      unitPrice: displayPrice,
    })

    setAddedAnimation(true)
    window.clearTimeout(addedTimer.current)
    addedTimer.current = window.setTimeout(() => {
      setAddedAnimation(false)
      setOpen(true)
    }, 400)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        to="/shop"
        className="inline-flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Store</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image Tile */}
        <div className="aspect-square w-full rounded-[20px] bg-[var(--color-surface)] border border-[var(--color-hairline)] flex items-center justify-center p-8 relative overflow-hidden">
          <ShoppingBag className="w-32 h-32 text-[var(--color-muted)]/40" />
          <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-caption font-bold bg-[var(--color-canvas)] text-[var(--color-ink)] shadow-xs">
            {product.category}
          </span>
        </div>

        {/* Product Purchase Column */}
        <div className="space-y-6">
          <div>
            <h1 className="text-display-lg font-display font-extrabold text-[var(--color-ink)] leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mt-3">
              <span className="text-money-xl font-bold text-[var(--color-ink)]">
                {formatMoney(displayPrice)}
              </span>

              {isMember ? (
                <>
                  <MemberPriceBadge />
                  <span className="text-caption text-[var(--color-muted)] line-through">
                    {formatMoney(product.standardPrice)}
                  </span>
                </>
              ) : (
                <Link
                  to="/join"
                  className="text-caption font-semibold text-[var(--color-primary)] hover:underline"
                >
                  Join to get for {formatMoney(product.memberPrice)}
                </Link>
              )}
            </div>
          </div>

          <p className="text-body-md text-[var(--color-body)] leading-relaxed">
            {product.description}
          </p>

          {/* Signature Size Picker per DESIGN.md */}
          <div className="space-y-2 pt-2 border-t border-[var(--color-hairline)]">
            <div className="flex items-center justify-between">
              <span className="text-body-sm-medium text-[var(--color-ink)] font-semibold">
                Select Size
              </span>
              <span className="text-caption text-[var(--color-muted)]">Unisex sizing</span>
            </div>

            <div role="radiogroup" aria-label="Size" className="flex flex-wrap gap-2.5">
              {product.sizes.map((s) => {
                const isSelected = selectedSize === s.size
                const isOutOfStock = s.stock <= 0
                const isLowStock = s.stock > 0 && s.stock <= 5

                return (
                  <div key={s.size} className="relative flex flex-col items-center">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`Size ${s.size}${isOutOfStock ? ', sold out' : isLowStock ? `, ${s.stock} left` : ''}`}
                      disabled={isOutOfStock}
                      onClick={() => setSelectedSize(s.size)}
                      className={cn(
                        'relative w-12 h-11 rounded-[10px] text-body-sm-medium font-semibold flex items-center justify-center transition-all cursor-pointer select-none',
                        isSelected
                          ? 'bg-[var(--color-ink)] text-[var(--color-on-ink)] ring-2 ring-[var(--color-ink)] ring-offset-2'
                          : isOutOfStock
                          ? 'bg-[var(--color-surface)] text-[var(--color-subtle)] border border-[var(--color-hairline)] cursor-not-allowed opacity-60'
                          : 'bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-hairline-strong)] hover:border-[var(--color-ink)]'
                      )}
                    >
                      {/* Diagonal strike for out-of-stock per DESIGN.md */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-full h-0.5 bg-[var(--color-subtle)] rotate-45" />
                        </div>
                      )}
                      <span>{s.size}</span>
                    </button>

                    {/* Low stock badge */}
                    {isLowStock && (
                      <span className="text-[10px] font-bold text-[var(--color-warning-deep)] mt-1 whitespace-nowrap">
                        {s.stock} left
                      </span>
                    )}

                    {isOutOfStock && (
                      <span className="text-[10px] text-[var(--color-muted)] mt-1 whitespace-nowrap">
                        Sold out
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Add to Cart Single Primary Button */}
          <div className="pt-4">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={isCurrentOutOfStock}
              onClick={handleAddToCart}
            >
              {isCurrentOutOfStock ? (
                'Size Out of Stock'
              ) : addedAnimation ? (
                <span className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-white" />
                  <span>Added to Cart!</span>
                </span>
              ) : (
                `Add to Cart • ${formatMoney(displayPrice)}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
