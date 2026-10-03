import { lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { PublicLayout } from './components/layout/PublicLayout'
import { MemberLayout } from './components/layout/MemberLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import { CheckinLayout } from './components/layout/CheckinLayout'
import { RouteEffects } from './components/navigation/RouteEffects'
import { RequireAuth } from './components/navigation/RequireAuth'
import { LandingPage } from './features/public/pages/LandingPage'
import { NotFoundPage } from './features/public/pages/NotFoundPage'
import { useAuthStore } from './stores/authStore'
import { ADMIN_CONSOLE_ROLES, CHECKIN_ROLES } from './lib/constants'

// Each page is its own chunk. Layouts render a PageBoundary around <Outlet />,
// so the header and navigation stay on screen while a page downloads.
const EventListPage = lazy(() =>
  import('./features/events/pages/EventListPage').then((m) => ({ default: m.EventListPage })),
)
const EventDetailPage = lazy(() =>
  import('./features/events/pages/EventDetailPage').then((m) => ({ default: m.EventDetailPage })),
)
const ShopPage = lazy(() =>
  import('./features/shop/pages/ShopPage').then((m) => ({ default: m.ShopPage })),
)
const ProductPage = lazy(() =>
  import('./features/shop/pages/ProductPage').then((m) => ({ default: m.ProductPage })),
)
const JoinPage = lazy(() =>
  import('./features/members/pages/JoinPage').then((m) => ({ default: m.JoinPage })),
)
const LoginPage = lazy(() =>
  import('./features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const AnnouncementFeed = lazy(() =>
  import('./features/announcements/pages/AnnouncementFeed').then((m) => ({
    default: m.AnnouncementFeed,
  })),
)
const MemberHome = lazy(() =>
  import('./features/dashboard/pages/MemberHome').then((m) => ({ default: m.MemberHome })),
)
const MemberPassPage = lazy(() =>
  import('./features/members/pages/MemberPassPage').then((m) => ({ default: m.MemberPassPage })),
)
const MyTicketsPage = lazy(() =>
  import('./features/tickets/pages/MyTicketsPage').then((m) => ({ default: m.MyTicketsPage })),
)
const AdminDashboard = lazy(() =>
  import('./features/dashboard/pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
)
const MemberListPage = lazy(() =>
  import('./features/members/pages/MemberListPage').then((m) => ({ default: m.MemberListPage })),
)
const AdminStockPage = lazy(() =>
  import('./features/shop/pages/AdminStockPage').then((m) => ({ default: m.AdminStockPage })),
)
const AnnouncementComposer = lazy(() =>
  import('./features/announcements/pages/AnnouncementComposer').then((m) => ({
    default: m.AnnouncementComposer,
  })),
)
const FundraiserPage = lazy(() =>
  import('./features/fundraisers/pages/FundraiserPage').then((m) => ({
    default: m.FundraiserPage,
  })),
)
const TreasuryDashboard = lazy(() =>
  import('./features/treasury/pages/TreasuryDashboard').then((m) => ({
    default: m.TreasuryDashboard,
  })),
)
const CheckinPage = lazy(() =>
  import('./features/tickets/pages/CheckinPage').then((m) => ({ default: m.CheckinPage })),
)

export function App() {
  // Confirm any stored session with /auth/me once on startup.
  useEffect(() => {
    void useAuthStore.getState().hydrate()
  }, [])

  return (
    <BrowserRouter>
      <RouteEffects />
      <Routes>
        {/* 1. Public Surfaces (max 1200px) */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="events" element={<EventListPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="shop/:id" element={<ProductPage />} />
          <Route path="join" element={<JoinPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="announcements" element={<AnnouncementFeed />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* 2. Member App (Phone-first, max 640px, bottom tab nav). Any signed-in user. */}
        <Route element={<RequireAuth />}>
          <Route path="/member" element={<MemberLayout />}>
            <Route index element={<MemberHome />} />
            <Route path="pass" element={<MemberPassPage />} />
            <Route path="tickets" element={<MyTicketsPage />} />
            <Route path="*" element={<Navigate to="/member" replace />} />
          </Route>
        </Route>

        {/* 3. Admin Console (Sidebar 248px + 1280px fluid container). Staff roles only. */}
        <Route element={<RequireAuth roles={ADMIN_CONSOLE_ROLES} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="members" element={<MemberListPage />} />
            <Route path="events" element={<EventListPage />} />
            <Route path="announcements" element={<AnnouncementComposer />} />
            <Route path="shop" element={<AdminStockPage />} />
            <Route path="fundraisers" element={<FundraiserPage />} />
            <Route path="treasury" element={<TreasuryDashboard />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>

        {/* 4. Door Staff Check-in Scanner (Full screen dark mode) */}
        <Route element={<RequireAuth roles={CHECKIN_ROLES} />}>
          <Route path="/checkin" element={<CheckinLayout />}>
            <Route path=":eventId" element={<CheckinPage />} />
            <Route index element={<Navigate to="/checkin/event-gala-1" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
