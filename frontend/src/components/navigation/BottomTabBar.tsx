import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Calendar, CreditCard, ShoppingBag, Menu } from 'lucide-react'
import { cn } from '../../lib/cn'

export const BottomTabBar: React.FC = () => {
  const tabs = [
    { to: '/member', label: 'Home', icon: Home, end: true },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/member/pass', label: 'Pass', icon: CreditCard, highlight: true },
    { to: '/shop', label: 'Shop', icon: ShoppingBag },
    { to: '/announcements', label: 'More', icon: Menu },
  ]

  return (
    <nav
      role="navigation"
      aria-label="Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[var(--color-canvas)]/95 backdrop-blur-md border-t border-[var(--color-hairline)] px-2 flex items-center justify-around select-none"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center flex-1 h-full py-1 text-caption-bold transition-colors',
              tab.highlight
                ? isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-ink)]'
                : isActive
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            )
          }
        >
          {({ isActive }) => (
            <>
              {tab.highlight ? (
                <div
                  className={cn(
                    'p-1.5 rounded-full -mt-2.5 transition-transform shadow-sm',
                    isActive
                      ? 'bg-[var(--color-primary)] text-white scale-110'
                      : 'bg-[var(--color-brand-navy)] text-white'
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                </div>
              ) : (
                <tab.icon className={cn('w-5 h-5 mb-0.5', isActive && 'stroke-[2.2]')} />
              )}
              <span className="text-[11px] leading-tight font-medium">
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
