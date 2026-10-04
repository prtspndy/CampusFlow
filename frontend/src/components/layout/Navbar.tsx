import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { canManageEvents } from '../../config/permissions';
import { Button } from '../ui/Button';
import {
  Search,
  Sun,
  Moon,
  Menu,
  X,
  PlusCircle,
  LogOut,
  User as UserIcon,
  Bell,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function Navbar({ onToggleSidebar, isSidebarOpen }: NavbarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-[#051424]/90 backdrop-blur border-b border-[#273647]/60 px-4 sm:px-6 flex items-center justify-between gap-4 light:bg-white/90 light:border-[#E2E8F0]">
      {/* Left: Mobile hamburger & Global search matching Stitch */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-[#8e8fa3] hover:text-[#d4e4fa] hover:bg-[#1c2b3c] transition-colors md:hidden light:text-slate-500 light:hover:bg-slate-100"
          aria-label="Toggle navigation menu"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Global Search form matching Stitch */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8fa3] pointer-events-none" />
          <input
            type="search"
            placeholder="Search members, receipts, tickets, SKU sizes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg bg-[#122131] text-[#d4e4fa] border border-[#273647]/70 placeholder:text-[#8e8fa3] focus:outline-none focus:border-[#0047FF] focus:ring-1 focus:ring-[#0047FF]/30 transition-all light:bg-slate-100 light:text-slate-900 light:border-slate-200 light:placeholder:text-slate-400"
          />
        </form>
      </div>

      {/* Right Action Icons & User Profile matching Stitch */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Create Event (if staff) */}
        {user && canManageEvents(user) && (
          <Link to="/events?action=create">
            <Button size="sm" variant="primary" className="hidden lg:inline-flex text-xs h-8 bg-[#0047FF] hover:bg-[#0038CC] shadow-none">
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              Create Event
            </Button>
          </Link>
        )}

        {/* Theme dual-mode toggle */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-[#c4c5da] hover:bg-[#1c2b3c] hover:text-[#d4e4fa] transition-colors light:text-slate-600 light:hover:bg-slate-100"
        >
          {theme === 'dark' ? <Moon className="w-4 h-4 text-[#7bd0ff]" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </button>

        {/* Notification Bell matching Stitch */}
        <button
          aria-label="Notifications"
          className="relative h-8 w-8 rounded-lg flex items-center justify-center text-[#c4c5da] hover:bg-[#1c2b3c] hover:text-[#d4e4fa] transition-colors light:text-slate-600 light:hover:bg-slate-100"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#0047FF] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            3
          </span>
        </button>

        {/* User Profile Chip / Menu matching Stitch */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-[#122131] border border-[#273647]/70 hover:bg-[#1c2b3c] transition-colors light:bg-slate-100 light:border-slate-200 light:hover:bg-slate-200"
            >
              <div className="w-7 h-7 rounded-full bg-[#0047FF] text-white flex items-center justify-center font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#d4e4fa] leading-tight light:text-slate-900">
                  {user.name}
                </span>
                <span className="text-[10px] text-[#8e8fa3] leading-tight light:text-slate-500">
                  {user.role === 'ADMIN' ? 'VP / Co-Lead' : user.roleDisplayName || user.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#8e8fa3]" />
            </button>

            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#122131] border border-[#273647] shadow-xl p-2 z-50 text-xs light:bg-white light:border-slate-200 light:shadow-lg">
                  <div className="px-3 py-2 border-b border-[#273647]/60 mb-1 light:border-slate-100">
                    <p className="font-semibold text-[#d4e4fa] truncate light:text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-[#8e8fa3] truncate light:text-slate-500">{user.email}</p>
                    <div className="mt-1.5 inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0047FF]/20 text-[#7bd0ff] border border-[#0047FF]/30 light:bg-blue-50 light:text-blue-700">
                      {user.roleDisplayName || user.role}
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded text-[#d4e4fa] hover:bg-[#1c2b3c] transition-colors light:text-slate-700 light:hover:bg-slate-100"
                  >
                    <UserIcon className="w-4 h-4 text-[#8e8fa3]" />
                    <span>My Profile</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button size="sm" variant="ghost">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" variant="primary">Get Started</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
