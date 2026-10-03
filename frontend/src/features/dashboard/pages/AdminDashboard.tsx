import React from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Calendar,
  ShoppingBag,
  Megaphone,
  CheckSquare,
  Landmark,
  ArrowRight,
  QrCode,
} from 'lucide-react'
import { StatTile } from '../../../components/cards/StatTile'
import { ModuleCard } from '../../../components/cards/ModuleCard'
import { formatMoney } from '../../../lib/format'

export const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-primary)]">
            Administration Console
          </span>
          <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)] mt-0.5">
            Executive Overview
          </h1>
          <p className="text-body-sm text-[var(--color-muted)] mt-1">
            Real-time status across members, events, merchandise, tasks, and treasury.
          </p>
        </div>

        <Link
          to="/checkin/event-gala-1"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[var(--color-brand-navy)] text-white hover:bg-slate-800 transition-colors text-body-sm font-semibold select-none shadow-sm"
        >
          <QrCode className="w-4 h-4 text-[var(--color-sunset)]" />
          <span>Launch Door Scanner</span>
        </Link>
      </div>

      {/* Top 4 Stat Tiles answering key questions per DESIGN.md */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Active Members"
          value="214"
          delta="+18 this month"
          deltaType="positive"
          icon={<Users className="w-5 h-5 text-[var(--color-tint-sky-deep)]" />}
        />
        <StatTile
          label="Gala RSVPs"
          value="192 of 200"
          delta="8 seats left"
          deltaType="positive"
          icon={<Calendar className="w-5 h-5 text-[var(--color-tint-peach-deep)]" />}
        />
        <StatTile
          label="Net Treasury Balance"
          value={formatMoney(56400)}
          delta="+₹14,200 this week"
          deltaType="positive"
          icon={<Landmark className="w-5 h-5 text-[var(--color-tint-sage-deep)]" />}
        />
        <StatTile
          label="Fundraiser Progress"
          value="69%"
          delta="₹34,500 of ₹50k"
          deltaType="neutral"
          icon={<CheckSquare className="w-5 h-5 text-[var(--color-tint-butter-deep)]" />}
        />
      </div>

      {/* 6 Module Hub Cards in their respective pastel tints per DESIGN.md */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-heading-2 font-display font-bold text-[var(--color-ink)]">
            Club Modules
          </h2>
          <span className="text-caption text-[var(--color-muted)]">
            Dedicated pastel identity for each domain
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Members Hub */}
          <Link to="/admin/members">
            <ModuleCard
              module="members"
              title="Membership Directory"
              subtitle="214 active • 12 expiring"
              icon={<Users className="w-5 h-5" />}
            >
              <p className="text-body-sm mb-4 line-clamp-2">
                Manage member rosters, renewal workflows, dues tiers, and member ID passes.
              </p>
              <span className="inline-flex items-center gap-1.5 text-caption font-bold">
                <span>Manage Members</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </ModuleCard>
          </Link>

          {/* Events Hub */}
          <Link to="/admin/events">
            <ModuleCard
              module="events"
              title="Events & Ticketing"
              subtitle="3 upcoming • 1 live check-in"
              icon={<Calendar className="w-5 h-5" />}
            >
              <p className="text-body-sm mb-4 line-clamp-2">
                Schedule venues, set member-exclusive pricing, monitor seat meters, and run check-ins.
              </p>
              <span className="inline-flex items-center gap-1.5 text-caption font-bold">
                <span>View Event Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </ModuleCard>
          </Link>

          {/* Announcements Hub */}
          <Link to="/admin/announcements">
            <ModuleCard
              module="announcements"
              title="Broadcast Bulletins"
              subtitle="2 published • 171 opens"
              icon={<Megaphone className="w-5 h-5" />}
            >
              <p className="text-body-sm mb-4 line-clamp-2">
                Compose rich bulletins targeted to all members, volunteers, or event ticket holders.
              </p>
              <span className="inline-flex items-center gap-1.5 text-caption font-bold">
                <span>Broadcast Update</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </ModuleCard>
          </Link>

          {/* Shop Hub */}
          <Link to="/admin/shop">
            <ModuleCard
              module="shop"
              title="Merchandise & Stock"
              subtitle="4 products • 2 low stock"
              icon={<ShoppingBag className="w-5 h-5" />}
            >
              <p className="text-body-sm mb-4 line-clamp-2">
                Track hoodie and shirt stock per size, update inventory, and fulfill student orders.
              </p>
              <span className="inline-flex items-center gap-1.5 text-caption font-bold">
                <span>Manage Inventory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </ModuleCard>
          </Link>

          {/* Tasks & Fundraiser Hub */}
          <Link to="/admin/fundraisers">
            <ModuleCard
              module="tasks"
              title="Tasks & Fundraisers"
              subtitle="₹34.5k raised • 1 unassigned task"
              icon={<CheckSquare className="w-5 h-5" />}
            >
              <p className="text-body-sm mb-4 line-clamp-2">
                Monitor campaign milestones, assign volunteer tasks, and prevent unassigned gaps.
              </p>
              <span className="inline-flex items-center gap-1.5 text-caption font-bold">
                <span>Open Task Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </ModuleCard>
          </Link>

          {/* Treasury Hub */}
          <Link to="/admin/treasury">
            <ModuleCard
              module="treasury"
              title="Treasury & Finance"
              subtitle="Semester balance • 2 reimbursements"
              icon={<Landmark className="w-5 h-5" />}
            >
              <p className="text-body-sm mb-4 line-clamp-2">
                Audit ledger inflows and outflows, approve volunteer reimbursements, and export reports.
              </p>
              <span className="inline-flex items-center gap-1.5 text-caption font-bold">
                <span>Open Treasury Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </ModuleCard>
          </Link>
        </div>
      </div>
    </div>
  )
}
