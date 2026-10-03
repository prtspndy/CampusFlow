import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Sparkles } from 'lucide-react'
import { FilterChips } from '../../../components/forms/FilterChips'
import { MemberPriceBadge } from '../../../components/badges/MemberPriceBadge'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { formatMoney } from '../../../lib/format'
import { api, isApiError } from '../../../lib/api'
import { useAuthStore } from '../../../stores/authStore'
import type { Product } from '../../../types/models'

export const ShopPage: React.FC = () => {
  const { user } = useAuthStore()
  const isMember = !!user?.membership && user.membership.status === 'ACTIVE'
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    const category = selectedCategory === 'ALL' ? '' : `&category=${encodeURIComponent(selectedCategory)}`
    api
      .get<{ products: Product[] }>(`/products?limit=100${category}`, {
        auth: false,
        signal: controller.signal,
      })
      .then((data) => setProducts(data.products.filter((product) => product.isAvailable !== false)))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(isApiError(err) ? err.message : 'The shop could not be loaded.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [selectedCategory])

  const categories = [
    { value: 'ALL', label: 'All Merch' },
    { value: 'Apparel', label: 'Apparel & Hoodies' },
    { value: 'Accessories', label: 'Accessories & Flasks' },
  ]

  const filteredProducts = products

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-tint-mint-deep)]">
            Official Club Merchandise
          </span>
          <h1 className="text-display-lg font-display text-[var(--color-ink)] font-extrabold tracking-tight mt-1">
            Campus Merch Store
          </h1>
          <p className="text-body-md text-[var(--color-muted)] mt-1">
            High quality student union apparel, hoodies, and accessories.
          </p>
        </div>

        {isMember ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary-tint)] text-[var(--color-primary-deep)] text-caption font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>15% Member Discount Applied</span>
          </div>
        ) : (
          <Link
            to="/join"
            className="text-caption font-semibold text-[var(--color-primary)] hover:underline"
          >
            Join the club for 15% off all merch →
          </Link>
        )}
      </div>

      <FilterChips
        options={categories}
        selected={selectedCategory}
        onChange={setSelectedCategory}
      />

      {loading && <p className="text-body-md text-[var(--color-muted)]">Loading the shop…</p>}
      {error && (
        <EmptyState
          icon={<ShoppingBag className="w-6 h-6" />}
          title="Shop unavailable"
          description={error}
          actionLabel="Try again"
          onAction={() => setSelectedCategory((current) => current)}
        />
      )}
      {!loading && !error && filteredProducts.length === 0 && (
        <EmptyState
          icon={<ShoppingBag className="w-6 h-6" />}
          title="Nothing in the shop yet"
          description="Available merchandise will show up here once the club publishes it."
        />
      )}

      {/* Product Grid: 2-up on mobile, 4-up on desktop per DESIGN.md */}
      {!loading && !error && (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pt-2">
        {filteredProducts.map((product) => {
          const displayPrice = isMember ? product.memberPrice : product.standardPrice
          return (
            <Link
              key={product.id}
              to={`/shop/${product.id}`}
              className="group flex flex-col rounded-[14px] overflow-hidden bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-hairline)] shadow-[var(--elevation-1)] hover:shadow-[var(--elevation-2)] transition-all duration-200 select-none"
            >
              <div className="aspect-square w-full bg-[var(--color-surface)] flex items-center justify-center relative overflow-hidden group-hover:bg-[var(--color-surface-sunken)] transition-colors">
                <ShoppingBag className="w-16 h-16 text-[var(--color-muted)]/40 group-hover:scale-105 transition-transform" />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--color-surface-sunken)] text-[var(--color-muted)]">
                  {product.category}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-body-md font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors leading-snug line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-caption text-[var(--color-muted)] line-clamp-2 mt-1">
                    {product.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[var(--color-hairline)] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-money-md font-bold text-[var(--color-ink)]">
                      {formatMoney(displayPrice)}
                    </span>
                    {isMember && <MemberPriceBadge text="Member" />}
                  </div>

                  {isMember && (
                    <span className="text-caption text-[var(--color-muted)] line-through text-[11px]">
                      {formatMoney(product.standardPrice)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
      )}
    </div>
  )
}
