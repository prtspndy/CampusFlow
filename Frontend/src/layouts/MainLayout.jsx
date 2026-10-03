import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import Footer from '../components/Footer/Footer';
import { useSidebar } from '../context/SidebarContext';

const MainLayout = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="cf-app-layout">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main Content Column */}
      <div
        className={`cf-main-wrapper ${
          isCollapsed ? 'sidebar-collapsed' : 'sidebar-open'
        }`}
      >
        <Navbar />

        <main className="cf-content-body animate-fade-in">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
