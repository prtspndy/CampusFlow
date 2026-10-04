import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNavigationItems, NavItem } from '../../config/navigation';
import { cn } from '../../lib/utils';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { user } = useAuth();
  const navItems = getNavigationItems(user);

  // Group items by section
  const sections: { key: 'OVERVIEW' | 'OPERATIONS' | 'GOVERNANCE'; label: string; items: NavItem[] }[] = [
    { key: 'OVERVIEW', label: 'Overview', items: navItems.filter((i) => i.section === 'OVERVIEW') },
    { key: 'OPERATIONS', label: 'Operations', items: navItems.filter((i) => i.section === 'OPERATIONS') },
    { key: 'GOVERNANCE', label: 'Governance', items: navItems.filter((i) => i.section === 'GOVERNANCE') },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 md:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container matching Stitch */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0d1c2d] border-r border-[#273647]/60 transition-all duration-200 select-none shadow-[0_1px_8px_rgba(0,0,0,0.4)]',
          'light:bg-white light:border-[#E2E8F0]',
          isCollapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-[#273647]/50 flex items-center justify-between light:border-[#E2E8F0]">
          <Link
            to={user ? '/dashboard' : '/'}
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 overflow-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0047FF] flex items-center justify-center text-white shrink-0 shadow-sm">
              <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 9L29 14.5V25.5L20 31L11 25.5V14.5L20 9Z" stroke="#38BDF8" strokeWidth="3" strokeLinejoin="round"/>
                <path d="M20 15L24.5 17.5V22.5L20 25L15.5 22.5V17.5L20 15Z" fill="#38BDF8"/>
              </svg>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-headline font-bold text-sm text-[#d4e4fa] tracking-tight leading-none light:text-slate-900">
                  CampusFlow
                </span>
                <span className="text-[10px] text-[#8e8fa3] font-medium leading-none mt-1 light:text-slate-500">
                  OS for Student Organizations
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1 rounded-md text-[#8e8fa3] hover:text-[#d4e4fa] hover:bg-[#1c2b3c] transition-colors light:text-slate-400 light:hover:bg-slate-100 light:hover:text-slate-800"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Term Widget (matches Stitch) */}
        {!isCollapsed && (
          <div className="mx-3 mt-3 p-2 rounded-lg bg-[#122131] border border-[#273647]/50 flex items-center justify-between shadow-sm light:bg-slate-50 light:border-slate-200">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-[#8e8fa3] font-semibold light:text-slate-400">
                Term
              </span>
              <span className="text-xs font-semibold text-[#d4e4fa] light:text-slate-800">
                Fall / Spring 2026
              </span>
            </div>
            <span className="text-[10px] font-semibold bg-[#006e4b]/40 text-[#67f4b7] px-2 py-0.5 rounded-full border border-[#006e4b]/50 light:bg-emerald-100 light:text-emerald-700 light:border-emerald-200">
              Active Term
            </span>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {sections.map(
            (sec) =>
              sec.items.length > 0 && (
                <div key={sec.key} className="space-y-1">
                  {!isCollapsed && (
                    <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">
                      {sec.label}
                    </div>
                  )}
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        onClick={onCloseMobile}
                        title={isCollapsed ? item.name : undefined}
                        className={({ isActive }) =>
                          cn(
                            'group flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                            isActive
                              ? 'bg-[#0047FF] text-white font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]'
                              : 'text-[#c4c5da] hover:bg-[#1c2b3c] hover:text-[#d4e4fa] light:text-slate-600 light:hover:bg-slate-100 light:hover:text-slate-900',
                            isCollapsed && 'justify-center px-0 py-2',
                          )
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!isCollapsed && <span className="truncate">{item.name}</span>}
                        {!isCollapsed && item.badge && (
                          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              ),
          )}
        </div>

        {/* Bottom Treasury & Settings Footer matching Stitch */}
        {!isCollapsed && (
          <div className="p-3 border-t border-[#273647]/50 bg-[#0d1c2d] space-y-2 light:bg-white light:border-slate-200">
            <Link
              to="/treasury"
              onClick={onCloseMobile}
              className="p-2 rounded-lg bg-[#122131] border border-[#273647]/60 flex items-center justify-between hover:border-[#38BDF8]/40 transition-colors light:bg-slate-50 light:border-slate-200 block"
            >
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-[#8e8fa3] font-semibold light:text-slate-400">
                  Club Treasury
                </span>
                <span className="font-mono text-xs font-bold text-[#4edea3] light:text-emerald-600">
                  $8,420.50
                </span>
              </div>
              <span className="text-[10px] font-medium text-[#4edea3] bg-[#1c2b3c] px-2 py-0.5 rounded border border-[#273647] light:bg-slate-200 light:text-slate-700">
                Available
              </span>
            </Link>

            <div className="flex items-center justify-between px-2 py-1 text-xs text-[#8e8fa3] light:text-slate-500">
              <Link
                to="/profile"
                onClick={onCloseMobile}
                className="flex items-center gap-1.5 hover:text-[#d4e4fa] transition-colors light:hover:text-slate-900"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings & Audit</span>
              </Link>
              <span className="text-[10px] font-mono text-[#8e8fa3]/80">v2.4</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
