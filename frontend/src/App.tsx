import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { PublicLayout } from './components/layout/PublicLayout'
import { MemberLayout } from './components/layout/MemberLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import { CheckinLayout } from './components/layout/CheckinLayout'
import { LandingPage } from './features/public/pages/LandingPage'

const EventListPage = lazy(() =>
  import('./features/events/pages/EventListPage').then((module) => ({
    default: module.EventListPage,
  })),
)
const EventDetailPage = lazy(() =>
  import('./features/events/pages/EventDetailPage').then((module) => ({
    default: module.EventDetailPage,
  })),
)
const ShopPage = lazy(() =>
  import('./features/shop/pages/ShopPage').then((module) => ({ default: module.ShopPage })),
)
const ProductPage = lazy(() =>
  import('./features/shop/pages/ProductPage').then((module) => ({ default: module.ProductPage })),
)
const JoinPage = lazy(() =>
  import('./features/members/pages/JoinPage').then((module) => ({ default: module.JoinPage })),
)
const AnnouncementFeed = lazy(() =>
  import('./features/announcements/pages/AnnouncementFeed').then((module) => ({
    default: module.AnnouncementFeed,
  })),
)
const MemberHome = lazy(() =>
  import('./features/dashboard/pages/MemberHome').then((module) => ({ default: module.MemberHome })),
)
const MemberPassPage = lazy(() =>
  import('./features/members/pages/MemberPassPage').then((module) => ({
    default: module.MemberPassPage,
  })),
)
const MyTicketsPage = lazy(() =>
  import('./features/tickets/pages/MyTicketsPage').then((module) => ({
    default: module.MyTicketsPage,
  })),
)
const AdminDashboard = lazy(() =>
  import('./features/dashboard/pages/AdminDashboard').then((module) => ({
    default: module.AdminDashboard,
  })),
)
const MemberListPage = lazy(() =>
  import('./features/members/pages/MemberListPage').then((module) => ({
    default: module.MemberListPage,
  })),
)
const AdminStockPage = lazy(() =>
  import('./features/shop/pages/AdminStockPage').then((module) => ({
    default: module.AdminStockPage,
  })),
)
const AnnouncementComposer = lazy(() =>
  import('./features/announcements/pages/AnnouncementComposer').then((module) => ({
    default: module.AnnouncementComposer,
  })),
)
const FundraiserPage = lazy(() =>
  import('./features/fundraisers/pages/FundraiserPage').then((module) => ({
    default: module.FundraiserPage,
  })),
)
const TreasuryDashboard = lazy(() =>
  import('./features/treasury/pages/TreasuryDashboard').then((module) => ({
    default: module.TreasuryDashboard,
  })),
)
const CheckinPage = lazy(() =>
  import('./features/tickets/pages/CheckinPage').then((module) => ({ default: module.CheckinPage })),
)

function PageFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-sm text-[var(--color-muted)]">
      Loading
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* 1. Public Surfaces (max 1200px) */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="events" element={<EventListPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="shop/:id" element={<ProductPage />} />
          <Route path="join" element={<JoinPage />} />
          <Route path="announcements" element={<AnnouncementFeed />} />
        </Route>

        {/* 2. Member App (Phone-first, max 640px, bottom tab nav) */}
        <Route path="/member" element={<MemberLayout />}>
          <Route index element={<MemberHome />} />
          <Route path="pass" element={<MemberPassPage />} />
          <Route path="tickets" element={<MyTicketsPage />} />
        </Route>

        {/* 3. Admin Console (Sidebar 248px + 1280px fluid container) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="members" element={<MemberListPage />} />
          <Route path="events" element={<EventListPage />} />
          <Route path="announcements" element={<AnnouncementComposer />} />
          <Route path="shop" element={<AdminStockPage />} />
          <Route path="fundraisers" element={<FundraiserPage />} />
          <Route path="treasury" element={<TreasuryDashboard />} />
        </Route>

        {/* 4. Door Staff Check-in Scanner (Full screen dark mode) */}
        <Route path="/checkin" element={<CheckinLayout />}>
          <Route path=":eventId" element={<CheckinPage />} />
          <Route index element={<Navigate to="/checkin/event-gala-1" replace />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
