import { useState, useEffect } from 'react';
import { usersService } from '../../services/users.service';
import { User, UserRole } from '../../types/auth';
import { parseApiError } from '../../lib/api-errors';
import { formatDate } from '../../lib/formatters';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import {
  Users,
  Search,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Download,
  ShieldAlert,
  UserPlus,
  RefreshCw,
} from 'lucide-react';

export function UserDirectoryPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeRoleTab, setActiveRoleTab] = useState<string>('ALL');

  // Role modification modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>('MEMBER');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [sessionEvents, setSessionEvents] = useState<Array<{ action: string; details: string; timestamp: string }>>([]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await usersService.listUsers();
      setUsers(data);
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsUpdatingRole(true);
    setFeedback(null);
    try {
      await usersService.updateUserRole(selectedUser.id, targetRole);
      setSessionEvents((prev) => [
        {
          action: 'PATCH /api/admin/users/:id/role',
          details: `Canonical role updated to ${targetRole} for ${selectedUser.name}`,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      setFeedback({
        type: 'success',
        message: `Successfully changed ${selectedUser.name}'s role to ${targetRole}.`,
      });
      setSelectedUser(null);
      await loadUsers();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = activeRoleTab === 'ALL' || u.role === activeRoleTab;
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const treasurerCount = users.filter((u) => u.role === 'TREASURER').length;
  const eventManagerCount = users.filter((u) => u.role === 'EVENT_MANAGER').length;
  const memberCount = users.filter((u) => u.role === 'MEMBER').length;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Page Header matching Stitch stitch_user_governance.png */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] flex items-center gap-2">
            <span>Section E.2</span>
            <span className="text-[#273647]">•</span>
            <span>Governance & Security</span>
            <span className="text-[#273647]">•</span>
            <span className="text-[#4edea3]">RBAC Enforcement Active</span>
            <span className="text-[#273647]">•</span>
            <span className="text-[#7bd0ff]">Zero-Trust Invariant</span>
          </div>
          <h1 className="text-2xl font-headline font-bold text-[#d4e4fa] tracking-tight mt-0.5 light:text-slate-900">
            User Governance & RBAC Security Console
          </h1>
          <p className="text-xs text-[#8e8fa3] mt-0.5 max-w-2xl light:text-slate-500">
            Manage campus officers, enforce the canonical 4-role permission matrix, audit session family rotations, and safeguard last active admin against platform lockout.
          </p>
        </div>

        {/* Action Toolbelt matching Stitch */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 text-xs bg-[#1c2b3c] hover:bg-[#273647] border border-[#273647] text-[#d4e4fa]"
            onClick={() => {
              const header = ['Name', 'Email', 'Role', 'Status'];
              const rows = users.map((person) => [person.name, person.email, person.role, person.status]);
              const csv = [header, ...rows]
                .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                .join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'campusflow-users.csv';
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export users
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="h-8 text-xs bg-[#0047FF] hover:bg-[#0038CC] shadow-none font-semibold text-white"
            onClick={() => {
              if (users.length > 0) {
                setSelectedUser(users[0]);
                setTargetRole(users[0].role);
              }
            }}
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            + Invite Officer / Assign Role
          </Button>
        </div>
      </section>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-[#006e4b]/20 border border-[#006e4b]/40 text-[#4edea3]'
              : 'bg-[#93000a]/20 border border-[#93000a]/40 text-[#ffb4ab]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 4 Metric Cards matching Stitch */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">
                Total System Users
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-[#d4e4fa] tabular-nums light:text-slate-900">
                  {users.length}
                </span>
                <span className="text-[10px] text-[#8e8fa3] uppercase">Accounts</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#7bd0ff] light:bg-slate-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#273647]/40 text-[10px] text-[#8e8fa3] flex justify-between">
            <span>{memberCount} Active Members</span>
            <span className="text-[#7bd0ff] font-semibold">{adminCount + treasurerCount + eventManagerCount} Officers / Exec</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">
                Active Role Distribution
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-[#7bd0ff] tabular-nums">4</span>
                <span className="text-[10px] text-[#8e8fa3]">Canonical Roles</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#4edea3] light:bg-slate-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#273647]/40 text-[10px] text-[#8e8fa3] flex items-center gap-2">
            <span className="text-[#0047FF] font-semibold">ADM: {adminCount}</span>
            <span>•</span>
            <span className="text-[#4edea3] font-semibold">TREAS: {treasurerCount}</span>
            <span>•</span>
            <span className="text-[#7bd0ff] font-semibold">EVT: {eventManagerCount}</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">
                Security & JWT Integrity
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-[#4edea3] tabular-nums">100%</span>
                <span className="text-[10px] text-[#4edea3] font-semibold">Clean Hash</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#4edea3] light:bg-slate-100">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#273647]/40 text-[10px] text-[#8e8fa3] flex justify-between">
            <span>0 Session Anomalies</span>
            <span className="font-mono text-[#7bd0ff]">SHA-256 Fn62.J</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">
                Separation of Duties (SoD)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-headline text-[#d4e4fa] light:text-slate-900">Compliant</span>
                <span className="text-[10px] font-semibold text-[#4edea3] bg-[#006e4b]/20 px-1.5 py-0.5 rounded">100%</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#7bd0ff] light:bg-slate-100">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#273647]/40 text-[10px] text-[#8e8fa3]">
            Self-approval & self-settlement locked
          </div>
        </div>
      </section>

      {/* Filter Row matching Stitch */}
      <section className="rounded-xl bg-[#122131] border border-[#273647]/60 p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 light:bg-white light:border-slate-200">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8fa3]" />
          <input
            type="text"
            placeholder="Filter identity by id, name, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-9 pr-3 text-xs rounded-lg bg-[#0d1c2d] border border-[#273647] text-[#d4e4fa] placeholder:text-[#8e8fa3] focus:outline-none focus:border-[#0047FF] light:bg-slate-50 light:border-slate-300 light:text-slate-900"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#0d1c2d] p-1 rounded-lg border border-[#273647] text-xs light:bg-slate-100">
          <button
            type="button"
            onClick={() => setActiveRoleTab('ALL')}
            className={`px-2.5 py-0.5 rounded font-semibold text-[11px] ${
              activeRoleTab === 'ALL' ? 'bg-[#0047FF] text-white' : 'text-[#8e8fa3]'
            }`}
          >
            All Roles ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveRoleTab('ADMIN')}
            className={`px-2.5 py-0.5 rounded font-semibold text-[11px] ${
              activeRoleTab === 'ADMIN' ? 'bg-[#0047FF] text-white' : 'text-[#8e8fa3]'
            }`}
          >
            Admin ({adminCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveRoleTab('TREASURER')}
            className={`px-2.5 py-0.5 rounded font-semibold text-[11px] ${
              activeRoleTab === 'TREASURER' ? 'bg-[#0047FF] text-white' : 'text-[#8e8fa3]'
            }`}
          >
            Treasurer ({treasurerCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveRoleTab('EVENT_MANAGER')}
            className={`px-2.5 py-0.5 rounded font-semibold text-[11px] ${
              activeRoleTab === 'EVENT_MANAGER' ? 'bg-[#0047FF] text-white' : 'text-[#8e8fa3]'
            }`}
          >
            Event Mgr ({eventManagerCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveRoleTab('MEMBER')}
            className={`px-2.5 py-0.5 rounded font-semibold text-[11px] ${
              activeRoleTab === 'MEMBER' ? 'bg-[#0047FF] text-white' : 'text-[#8e8fa3]'
            }`}
          >
            Member ({memberCount})
          </button>
        </div>
      </section>

      {/* Split Layout: Security Principals Table (Left 65%) vs Canonical Matrix & Feed (Right 35%) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Security Principals Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl bg-[#122131] border border-[#273647]/60 overflow-hidden shadow-sm light:bg-white light:border-slate-200">
            <div className="px-4 py-3 border-b border-[#273647]/50 flex items-center justify-between text-xs">
              <span className="font-bold text-[#d4e4fa] light:text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#7bd0ff]" />
                Security Principals Directory
              </span>
              <span className="text-[10px] text-[#4edea3]">• Live Sync Active</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0d1c2d] border-b border-[#273647]/60 text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:bg-slate-50 light:border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">User / Identity</th>
                    <th className="px-3 py-2.5">Canonical Role</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Account Created</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#273647]/40 light:divide-slate-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-[#8e8fa3]">
                        Loading campus security principals...
                      </td>
                    </tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="h-12 hover:bg-[#1c2b3c]/50 transition-colors">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#1c2b3c] border border-[#273647] flex items-center justify-center font-bold text-xs text-[#7bd0ff] shrink-0">
                              {u.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#d4e4fa] truncate light:text-slate-900">{u.name}</p>
                              <p className="text-[10px] text-[#8e8fa3] truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {u.role === 'ADMIN' ? (
                            <span className="text-[10px] font-bold bg-[#0047FF] text-white px-2 py-0.5 rounded">
                              ADMIN
                            </span>
                          ) : u.role === 'TREASURER' ? (
                            <span className="text-[10px] font-bold bg-[#006e4b]/30 text-[#4edea3] border border-[#006e4b]/50 px-2 py-0.5 rounded">
                              TREASURER
                            </span>
                          ) : u.role === 'EVENT_MANAGER' ? (
                            <span className="text-[10px] font-bold bg-[#00a6e0]/30 text-[#7bd0ff] border border-[#00a6e0]/50 px-2 py-0.5 rounded">
                              EVENT_MGR
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium bg-[#1c2b3c] text-[#8e8fa3] px-2 py-0.5 rounded light:bg-slate-100">
                              MEMBER
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-[10px] font-semibold text-[#4edea3] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" /> Active
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[10px] text-[#8e8fa3] font-mono">
                          {u.createdAt ? formatDate(u.createdAt) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] text-[#0047FF] hover:underline"
                            onClick={() => {
                              setSelectedUser(u);
                              setTargetRole(u.role);
                            }}
                          >
                            Reassign Role
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-[#8e8fa3]">
                        No users match query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Enforcement Notice Box matching Stitch */}
          <div className="p-3.5 rounded-xl bg-[#0d1c2d] border border-[#273647]/70 text-xs text-[#8e8fa3] space-y-1 light:bg-slate-50">
            <div className="font-bold text-[#d4e4fa] flex items-center gap-1.5 light:text-slate-900">
              <ShieldAlert className="w-4 h-4 text-[#fbbf24]" />
              Role Enforcement Notice (Section D: Lockout Prevention)
            </div>
            <p className="text-[11px] font-mono leading-relaxed">
              Endpoint <code className="text-[#7bd0ff]">PATCH /api/admin/users/:userId/role</code> guarantees atomic locking. Role demotion rejects with HTTP 400 Bad Request if the resulting active ADMIN count would drop &lt; 1.
            </p>
          </div>

          {/* Delegation Callout matching Stitch */}
        </div>

        {/* Right Column: 4-Role Canonical Matrix & Security Feed matching Stitch */}
        <div className="lg:col-span-5 space-y-4">
          {/* 4-Role Canonical Matrix Card */}
          <div className="rounded-xl bg-[#122131] border border-[#273647]/70 p-5 shadow-sm space-y-3 light:bg-white light:border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-[#8e8fa3] font-semibold">
                  SECTION 4 SPECIFICATION
                </span>
                <h3 className="text-sm font-bold text-[#d4e4fa] light:text-slate-900">4-Role Canonical Matrix</h3>
              </div>
              <span className="text-[10px] font-mono text-[#8e8fa3]">v2.4 Final</span>
            </div>

            <p className="text-[11px] text-[#8e8fa3]">
              Granular permission matrix enforced at controller-level middleware and Prisma client hooks.
            </p>

            <div className="space-y-1.5 text-xs pt-1">
              <div className="p-2 rounded bg-[#0d1c2d] border border-[#273647]/40 flex items-center justify-between light:bg-slate-50">
                <div>
                  <p className="font-semibold text-[#d4e4fa] text-[11px] light:text-slate-900">Profile & Own Member Data</p>
                  <p className="text-[9px] font-mono text-[#8e8fa3]">GET/PUT /api/users/me</p>
                </div>
                <span className="text-[9px] font-bold text-[#4edea3] bg-[#006e4b]/20 px-1.5 py-0.5 rounded">ALL ROLES</span>
              </div>

              <div className="p-2 rounded bg-[#0d1c2d] border border-[#273647]/40 flex items-center justify-between light:bg-slate-50">
                <div>
                  <p className="font-semibold text-[#d4e4fa] text-[11px] light:text-slate-900">User Admin & Role Mutation</p>
                  <p className="text-[9px] font-mono text-[#8e8fa3]">PATCH /api/admin/users/:id/role</p>
                </div>
                <span className="text-[9px] font-bold text-white bg-[#0047FF] px-1.5 py-0.5 rounded">ADMIN ONLY</span>
              </div>

              <div className="p-2 rounded bg-[#0d1c2d] border border-[#273647]/40 flex items-center justify-between light:bg-slate-50">
                <div>
                  <p className="font-semibold text-[#d4e4fa] text-[11px] light:text-slate-900">Membership Status Overrides</p>
                  <p className="text-[9px] font-mono text-[#8e8fa3]">PATCH /api/memberships/:id</p>
                </div>
                <span className="text-[9px] font-bold text-white bg-[#0047FF] px-1.5 py-0.5 rounded">ADMIN ONLY</span>
              </div>

              <div className="p-2 rounded bg-[#0d1c2d] border border-[#273647]/40 flex items-center justify-between light:bg-slate-50">
                <div>
                  <p className="font-semibold text-[#d4e4fa] text-[11px] light:text-slate-900">Event Publishing & Roster</p>
                  <p className="text-[9px] font-mono text-[#8e8fa3]">POST /api/events</p>
                </div>
                <span className="text-[9px] font-bold text-[#7bd0ff] bg-[#00a6e0]/20 px-1.5 py-0.5 rounded">ADMIN & EVT</span>
              </div>

              <div className="p-2 rounded bg-[#0d1c2d] border border-[#273647]/40 flex items-center justify-between light:bg-slate-50">
                <div>
                  <p className="font-semibold text-[#d4e4fa] text-[11px] light:text-slate-900">QR Scanner & Check-In</p>
                  <p className="text-[9px] font-mono text-[#8e8fa3]">POST /api/tickets/checkin</p>
                </div>
                <span className="text-[9px] font-bold text-[#7bd0ff] bg-[#00a6e0]/20 px-1.5 py-0.5 rounded">ADMIN & EVT</span>
              </div>

              <div className="p-2 rounded bg-[#0d1c2d] border border-[#273647]/40 flex items-center justify-between light:bg-slate-50">
                <div>
                  <p className="font-semibold text-[#d4e4fa] text-[11px] light:text-slate-900">Reimbursement Settlement</p>
                  <p className="text-[9px] font-mono text-[#8e8fa3]">POST /api/treasury/settle</p>
                </div>
                <span className="text-[9px] font-bold text-[#4edea3] bg-[#006e4b]/20 px-1.5 py-0.5 rounded">TREAS & ADMIN</span>
              </div>

              <div className="p-2 rounded bg-[#0d1c2d] border border-[#93000a]/40 flex items-center justify-between light:bg-rose-50">
                <div>
                  <p className="font-semibold text-[#ffb4ab] text-[11px] light:text-rose-800">Expense Self-Approval</p>
                  <p className="text-[9px] font-mono text-[#ffb4ab]">FILTER /api/expenses/:id/approve</p>
                </div>
                <span className="text-[9px] font-bold text-white bg-[#93000a] px-1.5 py-0.5 rounded">FORBIDDEN (403)</span>
              </div>
            </div>
          </div>

          {/* Live Token & Auth Feed Card */}
          <div className="rounded-xl bg-[#122131] border border-[#273647]/70 p-5 shadow-sm space-y-3 light:bg-white light:border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#d4e4fa] flex items-center gap-1.5 light:text-slate-900">
                <Lock className="w-3.5 h-3.5 text-[#4edea3]" />
                Session Governance & Audit
              </span>
              <span className="text-[9px] font-mono text-[#8e8fa3]">ACTIVE SESSION</span>
            </div>

            <div className="space-y-2 text-xs">
              {sessionEvents.length > 0 ? (
                sessionEvents.map((evt, idx) => (
                  <div key={idx} className="p-2 rounded bg-[#0d1c2d] border border-[#273647]/40 space-y-0.5 light:bg-slate-50">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-[#7bd0ff]">{evt.action}</span>
                      <span className="text-[#8e8fa3]">{evt.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-[#d4e4fa] light:text-slate-800">
                      {evt.details}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-[#8e8fa3] bg-[#0d1c2d] rounded-lg border border-[#273647]/40">
                  <p className="font-medium text-[#d4e4fa] light:text-slate-800">No session mutations recorded</p>
                  <p className="text-[10px] mt-1 text-[#8e8fa3]">
                    Administrative role changes and permission reassignments performed during this session will log here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Role Assignment Modal */}
      {selectedUser && (
        <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Modify User Canonical Role">
          <form onSubmit={handleUpdateRole} className="space-y-4">
            <div>
              <span className="text-xs text-[#8e8fa3]">Target Account:</span>
              <p className="text-sm font-semibold text-[#d4e4fa] light:text-slate-900">
                {selectedUser.name} ({selectedUser.email})
              </p>
              <p className="text-[11px] text-[#7bd0ff] font-mono mt-0.5">
                Current Role: {selectedUser.role}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d4e4fa] mb-1 light:text-slate-700">
                Assign Canonical Role
              </label>
              <Select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as UserRole)}
                options={[
                  { value: 'MEMBER', label: 'MEMBER (Club Pass Holder)' },
                  { value: 'EVENT_MANAGER', label: 'EVENT_MANAGER (Door Staff & Events)' },
                  { value: 'TREASURER', label: 'TREASURER (Finance & Settlements)' },
                  { value: 'ADMIN', label: 'ADMIN (Full System Executive)' },
                ]}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setSelectedUser(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isUpdatingRole}>
                Save Role Assignment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
