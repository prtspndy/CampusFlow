import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { announcementsService } from '../../services/announcements.service';
import { eventsService } from '../../services/events.service';
import { volunteersService } from '../../services/volunteers.service';
import { membershipsService } from '../../services/memberships.service';
import { Announcement, AnnouncementAudience } from '../../types/announcements';
import { hasPermission } from '../../config/permissions';
import { parseApiError } from '../../lib/api-errors';
import { formatDate } from '../../lib/formatters';
import {
  Megaphone,
  Radio,
  Users,
  Rocket,
  Eye,
  CheckCircle,
  AlertCircle,
  Send,
  PlusCircle,
  Smartphone,
  MessageSquare,
  Mail,
  AlertTriangle,
  Info,
  Bold,
  Italic,
  List,
  Code,
  ShieldCheck,
  Check,
} from 'lucide-react';

export function AnnouncementsPage() {
  const { user } = useAuth();
  const canCreate = hasPermission(user, 'announcements.create');
  const canPublish = hasPermission(user, 'announcements.publish');

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Composer Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('ALL_MEMBERS');
  const [priority, setPriority] = useState<'standard' | 'urgent'>('standard');
  const [audienceCounts, setAudienceCounts] = useState<{
    members: number | null;
    volunteers: number | null;
    attendees: number | null;
  }>({ members: null, volunteers: null, attendees: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      if (canCreate) {
        const res = await announcementsService.listManaged();
        setAnnouncements(res.announcements || []);
        setTotal(res.total || 0);
      } else {
        const res = await announcementsService.listPublished();
        setAnnouncements(res.announcements || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsLoading(false);
    }
  }, [canCreate]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  useEffect(() => {
    let cancelled = false;
    async function loadAudienceCounts() {
      const next = {
        members: null as number | null,
        volunteers: null as number | null,
        attendees: null as number | null,
      };
      try {
        const events = await eventsService.listEvents({ status: 'PUBLISHED', limit: 100 });
        next.attendees = (events.events || []).reduce((sum, event) => sum + (event.registeredCount || 0), 0);
      } catch {
        next.attendees = null;
      }
      try {
        const shifts = await volunteersService.listOpportunities({ status: 'PUBLISHED', limit: 100 });
        next.volunteers = (shifts.opportunities || []).reduce(
          (sum, shift) => sum + (shift.registeredCount || 0),
          0,
        );
      } catch {
        next.volunteers = null;
      }
      if (hasPermission(user, 'membership:read:any')) {
        try {
          const members = await membershipsService.listMemberships({ status: 'ACTIVE', limit: 1 });
          const paged = members as typeof members & { pagination?: { total: number } };
          next.members = paged.pagination?.total ?? paged.total ?? 0;
        } catch {
          next.members = null;
        }
      }
      if (!cancelled) setAudienceCounts(next);
    }
    loadAudienceCounts();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleBroadcast = async (publishImmediate: boolean) => {
    if (!title.trim() || !body.trim()) {
      setFeedback({ type: 'error', message: 'Title and body payload cannot be empty.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const created = await announcementsService.createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        audience,
      });

      if (publishImmediate && canPublish) {
        await announcementsService.publishAnnouncement(created.id);
        setFeedback({
          type: 'success',
          message: `Broadcast #${created.id.slice(0, 8)} published and dispatched to ${audience}!`,
        });
      } else {
        setFeedback({
          type: 'success',
          message: `Draft announcement #${created.id.slice(0, 8)} saved successfully.`,
        });
      }

      await loadAnnouncements();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (ann: Announcement) => {
    setFeedback(null);
    try {
      if (ann.status === 'PUBLISHED') {
        await announcementsService.unpublishAnnouncement(ann.id);
        setFeedback({ type: 'success', message: `Unpublished "${ann.title}".` });
      } else {
        await announcementsService.publishAnnouncement(ann.id);
        setFeedback({ type: 'success', message: `Published "${ann.title}" to member feed.` });
      }
      await loadAnnouncements();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    setBody((prev) => `${prev}\n${prefix}sample${suffix}`);
  };

  const publishedCount = announcements.filter((a) => a.status === 'PUBLISHED').length;
  const draftCount = announcements.filter((a) => a.status === 'DRAFT').length;

  return (
    <div className="flex flex-col w-full pb-16 space-y-6">
      {/* Top Context Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#b9c3ff] light:text-indigo-600 font-semibold tracking-wider uppercase">
              Section E.9 • Broadcast Engine
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] bg-[#006e4b] text-[#67f4b7] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
              In-app feed
            </span>
          </div>
          <h1 className="text-3xl font-bold font-headline text-[#d4e4fa] light:text-slate-900 tracking-tight leading-tight">
            Announcements & Broadcast Engine
          </h1>
          <p className="text-sm text-[#c4c5da] light:text-slate-600 max-w-3xl mt-0.5">
            Publish announcements to the in-app feed for members, volunteers, or event attendees. WhatsApp and email are not connected.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setTitle('');
              setBody('');
              setPriority('standard');
            }}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0047ff] hover:bg-[#0047ff]/90 text-white text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Draft</span>
          </button>
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

      {/* Metric Pulse Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-xl bg-[#122131] light:bg-white border border-[#273647]/60 light:border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-[#8e8fa3] light:text-slate-500 uppercase tracking-wider block font-semibold">
                Total Dispatches
              </span>
              <span className="text-2xl text-[#d4e4fa] light:text-slate-900 font-bold mt-1 block font-mono">
                {total > 0 ? `${total} Records` : `${announcements.length} Records`}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#1c2b3c] light:bg-slate-100 flex items-center justify-center text-[#b9c3ff] light:text-indigo-600">
              <Radio className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#273647]/40 light:border-slate-200 flex items-center justify-between text-[11px]">
            <span className="text-[#4edea3] flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> {publishedCount} Published
            </span>
            <span className="text-[#8e8fa3] light:text-slate-500 font-mono">{draftCount} Drafts</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-xl bg-[#122131] light:bg-white border border-[#273647]/60 light:border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-[#8e8fa3] light:text-slate-500 uppercase tracking-wider block font-semibold">
                Target Audiences
              </span>
              <span className="text-2xl text-[#d4e4fa] light:text-slate-900 font-bold mt-1 block font-mono">
                {announcements.length > 0 ? 'Campus-Wide' : '—'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#1c2b3c] light:bg-slate-100 flex items-center justify-center text-[#7bd0ff]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#273647]/40 light:border-slate-200 flex items-center gap-1 text-[#c4c5da] light:text-slate-600 text-[11px]">
            <span className="text-[#d4e4fa] light:text-slate-900 font-medium">All Members</span>
            <span>• Volunteers & Officers</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-xl bg-[#122131] light:bg-white border border-[#273647]/60 light:border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-[#8e8fa3] light:text-slate-500 uppercase tracking-wider block font-semibold">
                Live Broadcasts
              </span>
              <span className="text-2xl text-[#d4e4fa] light:text-slate-900 font-bold mt-1 block font-mono">
                {publishedCount} Active
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#1c2b3c] light:bg-slate-100 flex items-center justify-center text-[#4edea3]">
              <Rocket className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#273647]/40 light:border-slate-200 flex items-center justify-between text-[11px]">
            <span className="text-[#4edea3] font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> In-app only
            </span>
            <span className="text-[#8e8fa3] light:text-slate-500">{draftCount} In Queue</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-xl bg-[#122131] light:bg-white border border-[#273647]/60 light:border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-[#8e8fa3] light:text-slate-500 uppercase tracking-wider block font-semibold">
                Draft Queue
              </span>
              <span className="text-2xl text-[#d4e4fa] light:text-slate-900 font-bold mt-1 block font-mono">
                {draftCount} Pending
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#1c2b3c] light:bg-slate-100 flex items-center justify-center text-[#b9c3ff] light:text-indigo-600">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#273647]/40 light:border-slate-200 flex items-center gap-1.5 text-[11px]">
            <span className="text-[#d4e4fa] light:text-slate-900 font-semibold">Unpublished Drafts</span>
            <span className="text-[#8e8fa3] light:text-slate-500">staged for dispatch</span>
          </div>
        </div>
      </div>

      {/* Workspace Two-Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Composer & Multi-Channel Broadcast Center (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          <div className="rounded-xl bg-[#122131] light:bg-white border border-[#273647]/60 light:border-slate-200 p-6 shadow-sm space-y-5">
            {/* Section Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#273647]/40 light:border-slate-200">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#b9c3ff] light:text-indigo-600" />
                <h2 className="text-lg font-bold font-headline text-[#d4e4fa] light:text-slate-900">
                  Multi-Channel Composer
                </h2>
              </div>
              <span className="font-mono text-[11px] text-[#8e8fa3] light:text-slate-500 uppercase">
                API /api/announcements/manage
              </span>
            </div>

            {/* 1. Target Audience Segment */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#8e8fa3] light:text-slate-500 font-semibold mb-2">
                1. Target Audience Segment
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAudience('ALL_MEMBERS')}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    audience === 'ALL_MEMBERS'
                      ? 'bg-[#0047ff] text-white border-[#0047ff] shadow-sm'
                      : 'bg-[#1c2b3c] light:bg-slate-100 text-[#c4c5da] light:text-slate-600 hover:text-[#d4e4fa] light:hover:text-slate-900 border-transparent'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider opacity-80 block font-semibold">
                    All Registered
                  </span>
                  <span className="text-base font-bold block mt-0.5 font-mono">
                    {audienceCounts.members === null ? '—' : audienceCounts.members}
                  </span>
                  <span className="font-mono text-[10px] opacity-90">ALL_MEMBERS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAudience('VOLUNTEERS')}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    audience === 'VOLUNTEERS'
                      ? 'bg-[#0047ff] text-white border-[#0047ff] shadow-sm'
                      : 'bg-[#1c2b3c] light:bg-slate-100 text-[#c4c5da] light:text-slate-600 hover:text-[#d4e4fa] light:hover:text-slate-900 border-transparent'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider opacity-80 block font-semibold">
                    Volunteers
                  </span>
                  <span className="text-base font-bold block mt-0.5 font-mono">
                    {audienceCounts.volunteers === null ? '—' : audienceCounts.volunteers}
                  </span>
                  <span className="font-mono text-[10px] opacity-90">VOLUNTEERS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAudience('EVENT_ATTENDEES')}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    audience === 'EVENT_ATTENDEES'
                      ? 'bg-[#0047ff] text-white border-[#0047ff] shadow-sm'
                      : 'bg-[#1c2b3c] light:bg-slate-100 text-[#c4c5da] light:text-slate-600 hover:text-[#d4e4fa] light:hover:text-slate-900 border-transparent'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider opacity-80 block font-semibold">
                    Event attendees
                  </span>
                  <span className="text-base font-bold block mt-0.5 font-mono">
                    {audienceCounts.attendees === null ? '—' : audienceCounts.attendees}
                  </span>
                  <span className="font-mono text-[10px] opacity-90">EVENT_ATTENDEES</span>
                </button>
              </div>
            </div>

            {/* 2. Distribution Channels */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#8e8fa3] light:text-slate-500 font-semibold mb-2">
                2. Distribution Channels
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1c2b3c] light:bg-slate-100 border border-[#273647]/50 light:border-slate-200 select-none">
                  <input
                    type="checkbox"
                    checked
                    readOnly
                    className="w-4 h-4 rounded bg-[#010f1f] light:bg-white text-[#0047ff] focus:ring-0"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs text-[#d4e4fa] light:text-slate-900 font-semibold flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-[#7bd0ff]" /> In-App Feed
                    </span>
                    <span className="text-[10px] text-[#4edea3]">Published on the site</span>
                  </div>
                </label>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1c2b3c]/60 light:bg-slate-50 border border-[#273647]/50 light:border-slate-200 opacity-70">
                  <input type="checkbox" checked={false} disabled className="w-4 h-4 rounded" />
                  <div className="flex flex-col">
                    <span className="text-xs text-[#d4e4fa] light:text-slate-900 font-semibold flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-[#4edea3]" /> WhatsApp
                    </span>
                    <span className="text-[10px] text-[#c4c5da] light:text-slate-600">Not connected</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1c2b3c]/60 light:bg-slate-50 border border-[#273647]/50 light:border-slate-200 opacity-70">
                  <input type="checkbox" checked={false} disabled className="w-4 h-4 rounded" />
                  <div className="flex flex-col">
                    <span className="text-xs text-[#d4e4fa] light:text-slate-900 font-semibold flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#b9c3ff] light:text-indigo-600" /> Email
                    </span>
                    <span className="text-[10px] text-[#c4c5da] light:text-slate-600">Not connected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Priority Level */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] uppercase tracking-wider text-[#8e8fa3] light:text-slate-500 font-semibold">
                  3. Broadcast Priority Level
                </label>
                <span className="text-[11px] text-[#c4c5da] light:text-slate-600">Preview only — not saved</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('standard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
                    priority === 'standard'
                      ? 'bg-[#0047ff] text-white border-[#0047ff] shadow-sm'
                      : 'bg-[#1c2b3c] light:bg-slate-100 text-[#c4c5da] light:text-slate-600 border-transparent'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" /> Standard Member Feed
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('urgent')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                    priority === 'urgent'
                      ? 'bg-[#93000a] text-[#ffdad6] border-[#ffb4ab]/40 shadow-sm'
                      : 'bg-[#1c2b3c] light:bg-slate-100 text-[#c4c5da] light:text-slate-600 border-transparent'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Urgent / Critical Alert (Pins to top)
                </button>
              </div>
            </div>

            {/* Subject Line */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#8e8fa3] light:text-slate-500 font-semibold mb-1.5">
                Broadcast Subject / Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Mandatory Spring Gala All-Hands"
                className="w-full h-[38px] px-3 bg-[#1c2b3c] light:bg-slate-100 border border-[#273647] light:border-slate-200 rounded-lg text-[#d4e4fa] light:text-slate-900 text-xs placeholder:text-[#8e8fa3] light:placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0047ff]"
              />
            </div>

            {/* Markdown Payload Content */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] uppercase tracking-wider text-[#8e8fa3] light:text-slate-500 font-semibold">
                  Markdown Payload Content
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => insertMarkdown('**', '**')}
                    className="w-7 h-7 rounded flex items-center justify-center text-[#8e8fa3] light:text-slate-500 hover:text-[#d4e4fa] light:hover:text-slate-900 hover:bg-[#273647] light:hover:bg-slate-200"
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('*', '*')}
                    className="w-7 h-7 rounded flex items-center justify-center text-[#8e8fa3] light:text-slate-500 hover:text-[#d4e4fa] light:hover:text-slate-900 hover:bg-[#273647] light:hover:bg-slate-200"
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('- ')}
                    className="w-7 h-7 rounded flex items-center justify-center text-[#8e8fa3] light:text-slate-500 hover:text-[#d4e4fa] light:hover:text-slate-900 hover:bg-[#273647] light:hover:bg-slate-200"
                    title="List"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('```\n', '\n```')}
                    className="w-7 h-7 rounded flex items-center justify-center text-[#8e8fa3] light:text-slate-500 hover:text-[#d4e4fa] light:hover:text-slate-900 hover:bg-[#273647] light:hover:bg-slate-200"
                    title="Code"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="w-full p-3 bg-[#1c2b3c] light:bg-slate-100 border border-[#273647] light:border-slate-200 rounded-lg text-[#d4e4fa] light:text-slate-900 text-xs placeholder:text-[#8e8fa3] light:placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0047ff] font-mono leading-relaxed resize-none"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#273647]/40 light:border-slate-200">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleBroadcast(false)}
                className="px-4 py-2 rounded-lg bg-[#1c2b3c] light:bg-slate-100 hover:bg-[#273647] light:hover:bg-slate-200 text-[#d4e4fa] light:text-slate-900 text-xs font-medium transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleBroadcast(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0047ff] hover:bg-[#0047ff]/90 text-white text-xs font-semibold shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>{isSubmitting ? 'Broadcasting...' : 'Publish & Broadcast Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Preview & Audit Ledger (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Live Mobile & Portal Preview Card */}
          <div className="rounded-xl bg-[#122131] light:bg-white border border-[#273647]/60 light:border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#7bd0ff]" />
                <h3 className="text-sm font-bold font-headline text-[#d4e4fa] light:text-slate-900">
                  Real-Time Member Feed Preview
                </h3>
              </div>
              <span className="text-[10px] bg-[#1c2b3c] light:bg-slate-100 text-[#c4c5da] light:text-slate-600 px-2 py-0.5 rounded font-mono">
                Live Render
              </span>
            </div>

            {/* Simulated Portal Card */}
            <div className="rounded-xl bg-[#010f1f] light:bg-white border border-[#273647]/50 light:border-slate-200 p-4 shadow-inner space-y-3">
              {priority === 'urgent' && (
                <div className="flex items-center justify-between px-2.5 py-1 rounded bg-[#93000a] text-[#ffdad6] text-[11px] font-semibold">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>CRITICAL NOTIFICATION • PINNED</span>
                  </div>
                  <span className="font-mono text-[10px]">NOW</span>
                </div>
              )}

              {/* Author Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#0047ff] text-white flex items-center justify-center text-xs font-semibold">
                    {user?.name ? user.name[0] : 'C'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#d4e4fa] light:text-slate-900 font-semibold leading-tight">
                      {user?.name || 'Not signed in'}
                    </span>
                    <span className="text-[10px] text-[#8e8fa3] light:text-slate-500 leading-tight">
                      {user?.roleDisplayName || 'Preview'} • to {audience}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-[#8e8fa3] light:text-slate-500 bg-[#1c2b3c] light:bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
                  Preview
                </span>
              </div>

              {/* Post Content */}
              <h4 className="text-sm font-bold text-[#d4e4fa] light:text-slate-900">
                {title || 'Untitled Broadcast Announcement'}
              </h4>
              <div className="text-xs text-[#c4c5da] light:text-slate-600 leading-relaxed space-y-1.5 font-sans whitespace-pre-wrap">
                {body || 'No payload content...'}
              </div>

              {/* Delivery Metadata */}
              <div className="pt-2 border-t border-[#273647]/40 light:border-slate-200 flex items-center justify-between text-[#8e8fa3] light:text-slate-500 text-[10px]">
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3" /> Not published yet
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> WhatsApp not connected
                </span>
              </div>
            </div>

            {/* WhatsApp Simulation */}
            <div className="p-3 rounded-lg bg-[#1c2b3c] light:bg-slate-100 border border-[#273647]/50 light:border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#8e8fa3] light:text-slate-500 font-semibold flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> In-app preview
                </span>
                <span className="text-[#8e8fa3] light:text-slate-500 font-mono text-[10px]">NOT SENT</span>
              </div>
              <p className="text-xs text-[#c4c5da] light:text-slate-600 italic">
                "{title ? title.slice(0, 50) : 'CampusFlow'}: Tap to view details: campusflow.app/announcements"
              </p>
            </div>
          </div>

          {/* Recent Broadcast Audit Log */}
          <div className="rounded-xl bg-[#122131] light:bg-white border border-[#273647]/60 light:border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#4edea3]" />
                <h3 className="text-sm font-bold font-headline text-[#d4e4fa] light:text-slate-900">
                  Audit Ledger & Dispatches
                </h3>
              </div>
              <span className="text-[11px] text-[#b9c3ff] light:text-indigo-600 font-mono">
                {announcements.length} records
              </span>
            </div>

            <div className="space-y-2.5">
              {isLoading ? (
                <div className="p-4 text-center text-xs text-[#8e8fa3] light:text-slate-500">
                  Loading broadcast ledger...
                </div>
              ) : announcements.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#8e8fa3] light:text-slate-500 bg-[#010f1f] light:bg-white rounded-lg">
                  No announcements recorded yet. Create your first broadcast above!
                </div>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3 rounded-lg bg-[#1c2b3c] light:bg-slate-100 border border-[#273647]/50 light:border-slate-200 space-y-2 hover:bg-[#273647] light:hover:bg-slate-200/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs text-[#d4e4fa] light:text-slate-900 font-semibold block leading-tight">
                          {ann.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[#8e8fa3] light:text-slate-500">
                          <span className="text-[#b9c3ff] light:text-indigo-600 font-mono">
                            {ann.audience}
                          </span>
                          <span>•</span>
                          <span>{formatDate(ann.createdAt)}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 ${
                          ann.status === 'PUBLISHED'
                            ? 'bg-[#006e4b] text-[#67f4b7]'
                            : 'bg-[#122131] light:bg-white text-[#8e8fa3] light:text-slate-500 border border-[#273647] light:border-slate-200'
                        }`}
                      >
                        {ann.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#273647]/30 light:border-slate-200 text-[10px]">
                      <div className="flex items-center gap-1.5 text-[#c4c5da] light:text-slate-600">
                        <span className="px-1.5 py-0.5 rounded bg-[#122131] light:bg-white text-[#8e8fa3] light:text-slate-500">In-app</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {canPublish && (
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(ann)}
                            className="text-[#7bd0ff] hover:underline font-semibold"
                          >
                            {ann.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
