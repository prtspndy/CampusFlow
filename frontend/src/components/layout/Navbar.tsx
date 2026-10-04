import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { canManageEvents, canReviewExpenses, hasPermission } from '../../config/permissions';
import { eventsService } from '../../services/events.service';
import { announcementsService } from '../../services/announcements.service';
import { membershipsService } from '../../services/memberships.service';
import { expensesService } from '../../services/expenses.service';
import { productsService } from '../../services/products.service';
import { usersService } from '../../services/users.service';
import { Announcement } from '../../types/announcements';
import { formatINR } from '../../lib/formatters';
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchHits, setSearchHits] = useState<{ kind: string; title: string; subtitle: string; href: string }[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState<Announcement[]>([]);

  useEffect(() => {
    let cancelled = false;
    announcementsService
      .listPublished({ limit: 5 })
      .then((result) => {
        if (!cancelled) setNotes(result.announcements || []);
      })
      .catch(() => {
        if (!cancelled) setNotes([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    const needle = query.toLowerCase();
    setSearching(true);
    setSearchOpen(true);
    const hits: { kind: string; title: string; subtitle: string; href: string }[] = [];

    const tasks: Promise<void>[] = [
      eventsService
        .listEvents({ search: query, limit: 5, status: 'PUBLISHED' })
        .then((result) => {
          for (const event of result.events || []) {
            hits.push({
              kind: 'Event',
              title: event.title,
              subtitle: event.venue || 'Event',
              href: `/events/${event.id}`,
            });
          }
        })
        .catch(() => undefined),
      announcementsService
        .listPublished({ search: query, limit: 5 })
        .then((result) => {
          for (const item of result.announcements || []) {
            hits.push({
              kind: 'Announcement',
              title: item.title,
              subtitle: 'Announcement',
              href: '/announcements',
            });
          }
        })
        .catch(() => undefined),
      productsService
        .listProducts({ search: query, limit: 5 })
        .then((result) => {
          for (const product of result.products || []) {
            hits.push({
              kind: 'Store',
              title: product.name,
              subtitle: product.sku || product.category || 'Merchandise',
              href: '/store',
            });
          }
        })
        .catch(() => undefined),
    ];

    if (hasPermission(user, 'membership:read:any')) {
      tasks.push(
        membershipsService
          .listMemberships({ search: query, limit: 5 })
          .then((result) => {
            for (const membership of result.memberships || []) {
              hits.push({
                kind: 'Member',
                title: membership.user?.name || membership.memberCode,
                subtitle: membership.user?.email || membership.planName,
                href: '/memberships',
              });
            }
          })
          .catch(() => undefined),
      );
    }

    if (user?.role === 'ADMIN') {
      tasks.push(
        usersService
          .listUsers()
          .then((people) => {
            for (const person of people.filter((item) =>
              `${item.name} ${item.email}`.toLowerCase().includes(needle),
            ).slice(0, 5)) {
              hits.push({
                kind: 'User',
                title: person.name,
                subtitle: person.email,
                href: '/admin/users',
              });
            }
          })
          .catch(() => undefined),
      );
    }

    if (canReviewExpenses(user)) {
      tasks.push(
        expensesService
          .listExpenses({ limit: 50 })
          .then((result) => {
            for (const expense of (result.expenses || []).filter((item) =>
              `${item.title} ${item.description}`.toLowerCase().includes(needle),
            ).slice(0, 5)) {
              hits.push({
                kind: 'Receipt',
                title: expense.title,
                subtitle: formatINR(expense.amount),
                href: '/expenses',
              });
            }
          })
          .catch(() => undefined),
      );
    }

    await Promise.all(tasks);
    setSearchHits(hits);
    setSearching(false);
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
            placeholder="Search events, members, receipts, store..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg bg-[#122131] text-[#d4e4fa] border border-[#273647]/70 placeholder:text-[#8e8fa3] focus:outline-none focus:border-[#0047FF] focus:ring-1 focus:ring-[#0047FF]/30 transition-all light:bg-slate-100 light:text-slate-900 light:border-slate-200 light:placeholder:text-slate-400"
          />
          {searchOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSearchOpen(false)} />
              <div className="absolute left-0 right-0 top-11 z-50 rounded-lg border border-[#273647] bg-[#122131] shadow-xl overflow-hidden light:bg-white light:border-slate-200">
                {searching ? (
                  <p className="px-3 py-3 text-xs text-[#8e8fa3] light:text-slate-500">Searching…</p>
                ) : searchHits.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-[#8e8fa3] light:text-slate-500">No matches.</p>
                ) : (
                  <ul className="max-h-72 overflow-y-auto py-1">
                    {searchHits.map((hit) => (
                      <li key={`${hit.kind}-${hit.href}-${hit.title}`}>
                        <Link
                          to={hit.href}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-[#1c2b3c] light:hover:bg-slate-100"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold text-[#d4e4fa] light:text-slate-900">{hit.title}</span>
                            <span className="block truncate text-[10px] text-[#8e8fa3] light:text-slate-500">{hit.subtitle}</span>
                          </span>
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#7bd0ff]">{hit.kind}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
                  }}
                  className="w-full border-t border-[#273647]/60 px-3 py-2 text-left text-[11px] font-semibold text-[#7bd0ff] hover:bg-[#1c2b3c] light:border-slate-200 light:hover:bg-slate-50"
                >
                  Open all event results
                </button>
              </div>
            </>
          )}
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
        <div className="relative">
          <button
            type="button"
            aria-label="Announcements"
            aria-expanded={notesOpen}
            onClick={() => setNotesOpen((open) => !open)}
            className="relative h-8 w-8 rounded-lg flex items-center justify-center text-[#c4c5da] hover:bg-[#1c2b3c] hover:text-[#d4e4fa] transition-colors light:text-slate-600 light:hover:bg-slate-100"
          >
            <Bell className="w-4 h-4" />
            {notes.length > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#0047FF] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {notes.length > 9 ? '9' : notes.length}
              </span>
            )}
          </button>
          {notesOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotesOpen(false)} />
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#122131] border border-[#273647] shadow-xl z-50 light:bg-white light:border-slate-200">
                <div className="px-3 py-2 border-b border-[#273647]/60 text-xs font-semibold text-[#d4e4fa] light:border-slate-100 light:text-slate-900">
                  Announcements
                </div>
                {notes.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-[#8e8fa3] light:text-slate-500">No published announcements.</p>
                ) : (
                  <ul className="max-h-72 overflow-y-auto py-1">
                    {notes.map((note) => (
                      <li key={note.id}>
                        <Link
                          to="/announcements"
                          onClick={() => setNotesOpen(false)}
                          className="block px-3 py-2 hover:bg-[#1c2b3c] light:hover:bg-slate-100"
                        >
                          <span className="block text-xs font-semibold text-[#d4e4fa] light:text-slate-900">{note.title}</span>
                          <span className="block text-[10px] text-[#8e8fa3] light:text-slate-500 line-clamp-2">{note.body}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

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
