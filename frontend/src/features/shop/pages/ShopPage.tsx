import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Sparkles } from 'lucide-react'
import { MOCK_PRODUCTS } from '../../../lib/mockData'
import { FilterChips } from '../../../components/forms/FilterChips'
import { MemberPriceBadge } from '../../../components/badges/MemberPriceBadge'
import { formatMoney } from '../../../lib/format'
import { useAuthStore } from '../../../stores/authStore'

export const ShopPage: React.FC = () => {
  const { user } = useAuthStore()
  const isMember = !!user?.membership && user.membership.status === 'ACTIVE'
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  const categories = [
    { value: 'ALL', label: 'All Merch', count: MOCK_PRODUCTS.length },
    { value: 'Apparel', label: 'Apparel & Hoodies' },
    { value: 'Accessories', label: 'Accessories & Flasks' },
  ]

  const filteredProducts = MOCK_PRODUCTS.filter(
    (p) => selectedCategory === 'ALL' || p.category === selectedCategory
  )

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

      {/* Product Grid: 2-up on mobile, 4-up on desktop per DESIGN.md */}
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
    </div>
  )
}
