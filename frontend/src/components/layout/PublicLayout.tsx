import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { cn } from '../../lib/utils';

export function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-canvas text-dark-text light:bg-light-canvas light:text-light-text flex flex-col">
      <Sidebar
        isCollapsed={false}
        onToggleCollapse={() => {}}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={cn('flex-1 flex flex-col transition-all duration-200 md:pl-60')}>
        <Navbar
          onToggleSidebar={() => setMobileOpen(!mobileOpen)}
          isSidebarOpen={mobileOpen}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
