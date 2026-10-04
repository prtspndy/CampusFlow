import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { volunteersService } from '../../services/volunteers.service';
import {
  VolunteerOpportunity,
  VolunteerRegistration,
  VolunteerSignupStatus,
} from '../../types/volunteers';
import { canManageVolunteers } from '../../config/permissions';
import { parseApiError } from '../../lib/api-errors';
import { formatDateTime, formatDate } from '../../lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  HeartHandshake,
  Calendar,
  MapPin,
  Users,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Ban,
  UserCheck,
  ShieldCheck,
  Check,
} from 'lucide-react';

export function VolunteersPage() {
  const { user, isAuthenticated } = useAuth();
  const isStaff = canManageVolunteers(user);

  const [activeTab, setActiveTab] = useState<'catalog' | 'my' | 'manage'>('catalog');
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [mySignups, setMySignups] = useState<VolunteerRegistration[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Signup Modal
  const [signupTarget, setSignupTarget] = useState<VolunteerOpportunity | null>(null);
  const [signupNotes, setSignupNotes] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Cancel Signup Confirmation
  const [cancelSignupTarget, setCancelSignupTarget] = useState<VolunteerRegistration | null>(null);
  const [isCancellingSignup, setIsCancellingSignup] = useState(false);

  // Staff: Create Opportunity Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [oppTitle, setOppTitle] = useState('');
  const [oppDesc, setOppDesc] = useState('');
  const [oppLoc, setOppLoc] = useState('');
  const [oppStartsAt, setOppStartsAt] = useState('');
  const [oppEndsAt, setOppEndsAt] = useState('');
  const [oppCapacity, setOppCapacity] = useState(10);
  const [oppCategory, setOppCategory] = useState('Event Staff');
  const [isCreatingOpp, setIsCreatingOpp] = useState(false);

  // Staff: Participant Roster & Attendance Modal
  const [rosterOpp, setRosterOpp] = useState<VolunteerOpportunity | null>(null);
  const [participants, setParticipants] = useState<VolunteerRegistration[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'my') {
        const signups = await volunteersService.getMySignups();
        setMySignups(signups || []);
      } else {
        const res = await volunteersService.listOpportunities({
          status: activeTab === 'manage' && isStaff ? undefined : 'PUBLISHED',
        });
        setOpportunities(res.opportunities || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, isStaff]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Signup
  const handleConfirmSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupTarget) return;

    if (!isAuthenticated) {
      window.location.assign('/login');
      return;
    }

    setIsSigningUp(true);
    setFeedback(null);

    try {
      await volunteersService.signup(signupTarget.id, signupNotes.trim() || undefined);
      setSignupTarget(null);
      setSignupNotes('');
      setFeedback({
        type: 'success',
        message: `Registered for "${signupTarget.title}" volunteer shift!`,
      });
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsSigningUp(false);
    }
  };

  // Handle Cancel Signup
  const handleCancelSignup = async () => {
    if (!cancelSignupTarget) return;
    setIsCancellingSignup(true);
    setFeedback(null);

    try {
      await volunteersService.cancelSignup(cancelSignupTarget.id);
      setCancelSignupTarget(null);
      setFeedback({ type: 'success', message: 'Volunteer shift cancelled.' });
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsCancellingSignup(false);
    }
  };

  // Staff: Create Opportunity
  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingOpp(true);
    setFeedback(null);

    try {
      await volunteersService.createOpportunity({
        title: oppTitle.trim(),
        description: oppDesc.trim(),
        location: oppLoc.trim(),
        startsAt: new Date(oppStartsAt).toISOString(),
        endsAt: new Date(oppEndsAt).toISOString(),
        capacity: Number(oppCapacity),
        category: oppCategory.trim() || undefined,
      });

      setIsCreateOpen(false);
      resetOppForm();
      setFeedback({ type: 'success', message: 'Volunteer opportunity drafted successfully!' });
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsCreatingOpp(false);
    }
  };

  const resetOppForm = () => {
    setOppTitle('');
    setOppDesc('');
    setOppLoc('');
    setOppStartsAt('');
    setOppEndsAt('');
    setOppCapacity(10);
    setOppCategory('Event Staff');
  };

  // Staff: Open Roster
  const handleOpenRoster = async (opp: VolunteerOpportunity) => {
    setRosterOpp(opp);
    setRosterLoading(true);
    try {
      const parts = await volunteersService.listParticipants(opp.id);
      setParticipants(parts || []);
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setRosterLoading(false);
    }
  };

  // Staff: Update Attendance
  const handleUpdateAttendance = async (
    signupId: string,
    status: VolunteerSignupStatus,
  ) => {
    try {
      await volunteersService.updateAttendance(signupId, { status });
      if (rosterOpp) {
        const parts = await volunteersService.listParticipants(rosterOpp.id);
        setParticipants(parts || []);
      }
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#273647]/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#b9c3ff] font-semibold tracking-wider uppercase">
              Operations • Volunteer Hub
            </span>
          </div>
          <h1 className="text-2xl font-headline font-bold text-[#d4e4fa] flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-[#b9c3ff]" />
            Volunteer Opportunities & Service
          </h1>
          <p className="text-xs text-[#c4c5da] mt-0.5">
            Support student activities, manage festival logistics, and log verified community hours
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[#273647] p-0.5 bg-[#010f1f] text-xs">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                activeTab === 'catalog'
                  ? 'bg-[#0047ff] text-white shadow-sm'
                  : 'text-[#8e8fa3] hover:text-[#d4e4fa]'
              }`}
            >
              Available Shifts
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                activeTab === 'my'
                  ? 'bg-[#0047ff] text-white shadow-sm'
                  : 'text-[#8e8fa3] hover:text-[#d4e4fa]'
              }`}
            >
              My Shifts
            </button>
            {isStaff && (
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  activeTab === 'manage'
                    ? 'bg-[#0047ff] text-white shadow-sm'
                    : 'text-[#8e8fa3] hover:text-[#d4e4fa]'
                }`}
              >
                Staff Management
              </button>
            )}
          </div>

          {isStaff && (
            <button
              onClick={() => setIsCreateOpen(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0047ff] hover:bg-[#0047ff]/90 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Opportunity</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-[#003824]/80 border border-[#006e4b] text-[#67f4b7]'
              : 'bg-[#93000a]/80 border border-[#ffb4ab]/40 text-[#ffdad6]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-[#4edea3]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-[#ffb4ab]" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* CATALOG VIEW */}
      {(activeTab === 'catalog' || activeTab === 'manage') && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-60 rounded-xl w-full" />
              ))}
            </div>
          ) : opportunities.length === 0 ? (
            <EmptyState
              icon={HeartHandshake}
              title="No Volunteer Opportunities"
              description="There are currently no volunteer positions open for registration."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {opportunities.map((opp) => {
                const isFull = opp.registeredCount >= opp.capacity;
                return (
                  <Card key={opp.id} className="flex flex-col justify-between overflow-hidden bg-[#122131] border border-[#273647]/60">
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        {opp.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#006e4b]/20 border border-[#006e4b]/40 text-[#4edea3] font-semibold uppercase">
                            {opp.category}
                          </span>
                        )}
                        <Badge status={opp.status} />
                      </div>

                      <h3 className="font-headline font-bold text-base text-[#d4e4fa]">
                        {opp.title}
                      </h3>

                      <p className="text-xs text-[#c4c5da] line-clamp-2 leading-relaxed">
                        {opp.description}
                      </p>

                      <div className="space-y-1.5 pt-2 border-t border-[#273647]/40 text-xs text-[#8e8fa3]">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#b9c3ff] shrink-0" />
                          <span>{formatDateTime(opp.startsAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#7bd0ff] shrink-0" />
                          <span className="truncate">{opp.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-[#4edea3] shrink-0" />
                          <span className="font-mono text-[#d4e4fa]">
                            {opp.registeredCount} / {opp.capacity} volunteers signed up
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-3.5 border-t border-[#273647]/60 bg-[#010f1f]/50 flex items-center justify-between gap-2">
                      {isStaff ? (
                        <div className="flex items-center gap-2 w-full justify-between">
                          <button
                            type="button"
                            className="h-8 px-3 rounded-lg bg-[#1c2b3c] hover:bg-[#273647] text-[#d4e4fa] text-xs flex-1 flex items-center justify-center gap-1 transition-colors"
                            onClick={() => handleOpenRoster(opp)}
                          >
                            <Users className="w-3.5 h-3.5 mr-1" />
                            Roster ({opp.registeredCount})
                          </button>
                          {opp.status === 'DRAFT' && (
                            <button
                              type="button"
                              className="h-8 px-3 rounded-lg bg-[#0047ff] hover:bg-[#0047ff]/90 text-white text-xs font-semibold"
                              onClick={async () => {
                                await volunteersService.publishOpportunity(opp.id);
                                loadData();
                              }}
                            >
                              Publish
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="w-full h-8 rounded-lg bg-[#0047ff] hover:bg-[#0047ff]/90 text-white text-xs font-semibold disabled:opacity-50 disabled:bg-[#1c2b3c] disabled:text-[#8e8fa3]"
                          disabled={isFull || opp.status !== 'PUBLISHED'}
                          onClick={() => setSignupTarget(opp)}
                        >
                          {isFull ? 'Position Filled' : 'Sign Up as Volunteer'}
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MY SIGNUPS TAB */}
      {activeTab === 'my' && (
        <Card className="bg-[#122131] border border-[#273647]/60">
          <CardHeader>
            <CardTitle>My Volunteer Commitments ({mySignups.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : mySignups.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={HeartHandshake}
                  title="No Active Shifts"
                  description="You have not signed up for any volunteer opportunities yet."
                  actionText="Explore Opportunities"
                  onAction={() => setActiveTab('catalog')}
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableHead>Opportunity / Role</TableHead>
                  <TableHead>Shift Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead align="right">Actions</TableHead>
                </TableHeader>
                <TableBody>
                  {mySignups.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <span className="font-semibold text-[#d4e4fa]">
                          {s.opportunity?.title || 'Volunteer Role'}
                        </span>
                      </TableCell>
                      <TableCell>{formatDateTime(s.opportunity?.startsAt)}</TableCell>
                      <TableCell>{s.opportunity?.location || '—'}</TableCell>
                      <TableCell>
                        <Badge status={s.status} />
                      </TableCell>
                      <TableCell align="right">
                        {s.status === 'REGISTERED' && (
                          <button
                            type="button"
                            className="h-7 text-[11px] px-2.5 rounded bg-[#93000a]/80 hover:bg-[#93000a] text-[#ffdad6] inline-flex items-center gap-1 transition-colors"
                            onClick={() => setCancelSignupTarget(s)}
                          >
                            <Ban className="w-3 h-3" />
                            <span>Cancel Shift</span>
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sign Up Confirmation Modal */}
      {signupTarget && (
        <Modal
          isOpen={Boolean(signupTarget)}
          onClose={() => setSignupTarget(null)}
          title={`Sign Up: ${signupTarget.title}`}
          description={`Shift: ${formatDateTime(signupTarget.startsAt)} at ${signupTarget.location}`}
        >
          <form onSubmit={handleConfirmSignup} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#c4c5da] mb-1.5">
                Volunteer Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Mention past experience, preferred station, or dietary restrictions..."
                value={signupNotes}
                onChange={(e) => setSignupNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#1c2b3c] text-[#d4e4fa] border border-[#273647] focus:outline-none focus:ring-1 focus:ring-[#0047ff]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#273647]/60">
              <button
                type="button"
                onClick={() => setSignupTarget(null)}
                className="px-3 py-1.5 rounded-lg bg-[#1c2b3c] text-xs text-[#c4c5da]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSigningUp}
                className="px-4 py-1.5 rounded-lg bg-[#0047ff] hover:bg-[#0047ff]/90 text-white text-xs font-semibold"
              >
                {isSigningUp ? 'Signing up...' : 'Confirm Shift Signup'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Signup Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancelSignupTarget)}
        onClose={() => setCancelSignupTarget(null)}
        onConfirm={handleCancelSignup}
        title="Cancel Volunteer Shift"
        description="Are you sure you want to cancel your commitment for this volunteer position? The slot will be reopened to other students."
        confirmText="Cancel Commitment"
        variant="danger"
        isLoading={isCancellingSignup}
      />

      {/* Staff: Create Opportunity Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="New Volunteer Opportunity"
          description="Create a volunteer shift for an upcoming event or campus initiative"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateOpportunity} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#c4c5da] mb-1">
                Opportunity Title
              </label>
              <input
                required
                placeholder="e.g. Stage Setup & Artist Hospitality"
                value={oppTitle}
                onChange={(e) => setOppTitle(e.target.value)}
                className="w-full h-9 px-3 bg-[#1c2b3c] border border-[#273647] rounded-lg text-xs text-[#d4e4fa]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#c4c5da] mb-1">
                Description
              </label>
              <textarea
                rows={3}
                required
                placeholder="Key volunteer duties, reporting instructions, dress requirements..."
                value={oppDesc}
                onChange={(e) => setOppDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#1c2b3c] text-[#d4e4fa] border border-[#273647] focus:outline-none focus:ring-1 focus:ring-[#0047ff]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#c4c5da] mb-1">Location</label>
                <input
                  required
                  placeholder="e.g. Backstage Gate 2"
                  value={oppLoc}
                  onChange={(e) => setOppLoc(e.target.value)}
                  className="w-full h-9 px-3 bg-[#1c2b3c] border border-[#273647] rounded-lg text-xs text-[#d4e4fa]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#c4c5da] mb-1">Category</label>
                <input
                  value={oppCategory}
                  onChange={(e) => setOppCategory(e.target.value)}
                  className="w-full h-9 px-3 bg-[#1c2b3c] border border-[#273647] rounded-lg text-xs text-[#d4e4fa]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#c4c5da] mb-1">
                  Shift Starts
                </label>
                <input
                  type="datetime-local"
                  required
                  value={oppStartsAt}
                  onChange={(e) => setOppStartsAt(e.target.value)}
                  className="w-full h-9 px-3 bg-[#1c2b3c] border border-[#273647] rounded-lg text-xs text-[#d4e4fa]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#c4c5da] mb-1">
                  Shift Ends
                </label>
                <input
                  type="datetime-local"
                  required
                  value={oppEndsAt}
                  onChange={(e) => setOppEndsAt(e.target.value)}
                  className="w-full h-9 px-3 bg-[#1c2b3c] border border-[#273647] rounded-lg text-xs text-[#d4e4fa]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#c4c5da] mb-1">
                Volunteer Capacity
              </label>
              <input
                type="number"
                min="1"
                required
                value={oppCapacity}
                onChange={(e) => setOppCapacity(Number(e.target.value))}
                className="w-full h-9 px-3 bg-[#1c2b3c] border border-[#273647] rounded-lg text-xs text-[#d4e4fa] font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#273647]/60">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-[#1c2b3c] text-xs text-[#c4c5da]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingOpp}
                className="px-4 py-1.5 rounded-lg bg-[#0047ff] hover:bg-[#0047ff]/90 text-white text-xs font-semibold"
              >
                {isCreatingOpp ? 'Saving...' : 'Save as Draft'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Staff: Participant Roster & Attendance Marking Modal */}
      {rosterOpp && (
        <Modal
          isOpen={Boolean(rosterOpp)}
          onClose={() => setRosterOpp(null)}
          title={`Volunteer Roster — ${rosterOpp.title}`}
          description={`Logged Participants (${participants.length} / ${rosterOpp.capacity})`}
          maxWidth="lg"
        >
          <div className="space-y-4 pt-2">
            {rosterLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#8e8fa3]">
                No volunteers have signed up for this shift yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Attendance Status</TableHead>
                  <TableHead align="right">Mark</TableHead>
                </TableHeader>
                <TableBody>
                  {participants.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span className="font-semibold text-[#d4e4fa]">
                          {p.user?.name || 'Student'}
                        </span>
                      </TableCell>
                      <TableCell isMono>{p.user?.email || '—'}</TableCell>
                      <TableCell>
                        <Badge status={p.status} />
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="h-6 text-[10px] px-2 rounded bg-[#006e4b]/30 text-[#4edea3] hover:bg-[#006e4b]/60 transition-colors"
                            onClick={() => handleUpdateAttendance(p.id, 'ATTENDED')}
                          >
                            Attended
                          </button>
                          <button
                            type="button"
                            className="h-6 text-[10px] px-2 rounded bg-[#93000a]/30 text-[#ffb4ab] hover:bg-[#93000a]/60 transition-colors"
                            onClick={() => handleUpdateAttendance(p.id, 'NO_SHOW')}
                          >
                            No Show
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-lg bg-[#1c2b3c] hover:bg-[#273647] text-[#d4e4fa] text-xs"
                onClick={() => setRosterOpp(null)}
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
