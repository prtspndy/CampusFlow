import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { MOCK_EVENTS, MOCK_PRODUCTS } from '../../../lib/mockData'
import { EventCard } from '../../../components/cards/EventCard'
import { formatMoney } from '../../../lib/format'
import { ORG_NAME } from '../../../lib/constants'

export const LandingPage: React.FC = () => {

  return (
    <div className="space-y-16 py-4">
      {/* 1. Hero Band: Alternating Rhythm (White Canvas) */}
      <section className="text-center max-w-3xl mx-auto space-y-6 pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-primary-tint)] text-[var(--color-primary-deep)] text-caption font-semibold">
          <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
          <span>The Operating System for Student Organizations</span>
        </div>

        <h1 className="text-display-xl font-display font-extrabold text-[var(--color-ink)] tracking-tight leading-[1.08]">
          One platform where our club runs everything.
        </h1>

        <p className="text-body-lg text-[var(--color-body)] max-w-xl mx-auto leading-relaxed">
          The official home of the {ORG_NAME}. Discover campus events, get member discounts on merch, and access your digital pass.
        </p>

        {/* Exactly One Primary Action per screen per DESIGN.md */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/join">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              Join Membership • ₹499/yr
            </Button>
          </Link>
          <Link to="/events">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Explore Events
            </Button>
          </Link>
        </div>
      </section>

      {/* 2. Tinted Module Rhythm Band: Sky / Events Highlights */}
      <section className="rounded-[20px] bg-[var(--color-surface)] p-6 sm:p-10 border border-[var(--color-hairline)] space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-sunset)]">
              Happening Next
            </span>
            <h2 className="text-display-lg font-display font-extrabold text-[var(--color-ink)] mt-1">
              Featured Campus Event
            </h2>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-body-sm-medium text-[var(--color-primary)] font-semibold hover:underline"
          >
            <span>View all upcoming</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="max-w-md mx-auto sm:max-w-none sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_EVENTS.slice(0, 3).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      {/* 3. Deep Brand Navy Hero Band: The Member Pass Physical Metaphor */}
      <section className="rounded-[24px] bg-[var(--color-brand-navy)] text-white p-8 sm:p-12 overflow-hidden relative shadow-[var(--elevation-3)]">
        <div className="h-1.5 absolute top-0 inset-x-0 bg-[var(--color-sunset)]" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-sunset)]">
              Physical Card Metaphor
            </span>
            <h2 className="text-display-lg font-display font-extrabold text-white leading-tight">
              Your official campus Member Pass in your pocket.
            </h2>
            <p className="text-body-md text-white/80 leading-relaxed">
              Skip queues with arm's-length QR scanning, unlock member-only admission rates, and get 15% off all association merchandise.
            </p>

            <ul className="space-y-2.5 text-body-sm text-white/90 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-sunset)]" />
                <span>Works offline even in basements and dark venues</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-sunset)]" />
                <span>Instant ticket code redundancy for cracked screens</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-sunset)]" />
                <span>One-tap renewal tracking with friendly grace periods</span>
              </li>
            </ul>

            <div className="pt-4">
              <Link to="/join">
                <Button variant="on-dark" size="lg">
                  Get Your Digital Pass
                </Button>
              </Link>
            </div>
          </div>

          {/* Pass Preview Mockup */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm rounded-[20px] bg-slate-900 border border-white/20 p-6 shadow-2xl relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[var(--color-sunset)] flex items-center justify-center text-white font-bold text-xs">
                    CF
                  </div>
                  <span className="text-caption font-bold tracking-wide uppercase text-white/90">
                    Skyline Member
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--color-success-tint)] text-[var(--color-success-deep)]">
                  ACTIVE
                </span>
              </div>
              <h3 className="text-heading-2 font-display text-white font-bold">
                Aanya Patel
              </h3>
              <p className="text-caption font-mono text-white/60 mb-4">
                CF-8831-2026 • Annual Gold
              </p>
              <div className="h-32 bg-white rounded-[12px] flex items-center justify-center text-[var(--color-brand-navy)] font-mono font-bold text-xs">
                [SCANNABLE QR PASS]
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. White Canvas: Merchandise Store Sneak Peek */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-tint-mint-deep)]">
              Club Pride
            </span>
            <h2 className="text-display-lg font-display font-extrabold text-[var(--color-ink)] mt-1">
              Popular Club Merch
            </h2>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-body-sm-medium text-[var(--color-primary)] font-semibold hover:underline"
          >
            <span>Visit Full Store</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {MOCK_PRODUCTS.slice(0, 4).map((p) => (
            <Link
              key={p.id}
              to={`/shop/${p.id}`}
              className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-4 flex flex-col justify-between hover:shadow-[var(--elevation-2)] transition-shadow group"
            >
              <div className="aspect-square bg-[var(--color-surface)] rounded-[10px] flex items-center justify-center mb-3">
                <ShoppingBag className="w-12 h-12 text-[var(--color-muted)]/50 group-hover:scale-105 transition-transform" />
              </div>
              <h4 className="text-body-sm font-bold text-[var(--color-ink)] line-clamp-1">
                {p.name}
              </h4>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-hairline)] text-caption">
                <span className="font-bold text-money-md text-[var(--color-ink)]">
                  {formatMoney(p.memberPrice)}
                </span>
                <span className="text-[var(--color-muted)] line-through">
                  {formatMoney(p.standardPrice)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
