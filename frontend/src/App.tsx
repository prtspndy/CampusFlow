import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import { PublicLayout } from './components/layout/PublicLayout'
import { MemberLayout } from './components/layout/MemberLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import { CheckinLayout } from './components/layout/CheckinLayout'

// Public Pages
import { LandingPage } from './features/public/pages/LandingPage'
import { EventListPage } from './features/events/pages/EventListPage'
import { EventDetailPage } from './features/events/pages/EventDetailPage'
import { ShopPage } from './features/shop/pages/ShopPage'
import { ProductPage } from './features/shop/pages/ProductPage'
import { JoinPage } from './features/members/pages/JoinPage'
import { AnnouncementFeed } from './features/announcements/pages/AnnouncementFeed'

// Member Pages
import { MemberHome } from './features/dashboard/pages/MemberHome'
import { MemberPassPage } from './features/members/pages/MemberPassPage'
import { MyTicketsPage } from './features/tickets/pages/MyTicketsPage'

// Admin Pages
import { AdminDashboard } from './features/dashboard/pages/AdminDashboard'
import { MemberListPage } from './features/members/pages/MemberListPage'
import { AdminStockPage } from './features/shop/pages/AdminStockPage'
import { AnnouncementComposer } from './features/announcements/pages/AnnouncementComposer'
import { FundraiserPage } from './features/fundraisers/pages/FundraiserPage'
import { TreasuryDashboard } from './features/treasury/pages/TreasuryDashboard'

// Door Check-in
import { CheckinPage } from './features/tickets/pages/CheckinPage'

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
