import React, { useState } from 'react'
import { Save, PackagePlus } from 'lucide-react'
import { MOCK_PRODUCTS } from '../../../lib/mockData'
import { Button } from '../../../components/ui/Button'
import { formatMoney } from '../../../lib/format'
import type { Product } from '../../../types/models'

export const AdminStockPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS)
  const [savedNotice, setSavedNotice] = useState(false)

  const handleStockChange = (
    productId: string,
    size: string,
    newStock: number
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p
        return {
          ...p,
          sizes: p.sizes.map((s) =>
            s.size === size ? { ...s, stock: Math.max(0, newStock) } : s
          ),
        }
      })
    )
  }

  const handleSave = () => {
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-tint-mint-deep)]">
            Merchandise Management
          </span>
          <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)] mt-0.5">
            Inventory & Size Stock
          </h1>
          <p className="text-body-sm text-[var(--color-muted)] mt-1">
            Inline stock adjustment per garment size with low-stock alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => alert('New product catalog modal')}
            className="flex items-center gap-1.5"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Add Product</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            className="flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{savedNotice ? 'Saved!' : 'Save Quantities'}</span>
          </Button>
        </div>
      </div>

      {/* Products Stock Breakdown */}
      <div className="space-y-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-6 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-hairline)]">
              <div>
                <h3 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
                  {product.name}
                </h3>
                <div className="flex items-center gap-3 text-caption text-[var(--color-muted)] mt-0.5">
                  <span>Standard: {formatMoney(product.standardPrice)}</span>
                  <span>•</span>
                  <span>Member: {formatMoney(product.memberPrice)}</span>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-caption font-semibold bg-[var(--color-surface-sunken)] text-[var(--color-body)]">
                {product.category}
              </span>
            </div>

            {/* Inline Size Inventory Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {product.sizes.map((s) => {
                const isOut = s.stock <= 0
                const isLow = s.stock > 0 && s.stock <= 5

                return (
                  <div
                    key={s.size}
                    className="p-3 rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-hairline)] space-y-2 text-center"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-body-sm font-bold text-[var(--color-ink)]">
                        Size {s.size}
                      </span>
                      {isLow && (
                        <span className="text-[10px] font-bold text-[var(--color-warning-deep)] bg-[var(--color-warning-tint)] px-1.5 py-0.5 rounded-full">
                          Low
                        </span>
                      )}
                      {isOut && (
                        <span className="text-[10px] font-bold text-[var(--color-error-deep)] bg-[var(--color-error-tint)] px-1.5 py-0.5 rounded-full">
                          Out
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={s.stock}
                        onChange={(e) =>
                          handleStockChange(
                            product.id,
                            s.size,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-16 h-9 text-center font-mono font-bold text-body-md rounded-[8px] bg-[var(--color-canvas)] border border-[var(--color-hairline-strong)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
