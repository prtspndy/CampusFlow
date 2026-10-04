import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fundraisersService } from '../../services/fundraisers.service';
import { volunteersService } from '../../services/volunteers.service';
import { reimbursementsService } from '../../services/reimbursements.service';
import {
  Fundraiser,
  FundraiserContribution,
  FundraiserSummary,
} from '../../types/fundraisers';
import { VolunteerOpportunity } from '../../types/volunteers';
import { Reimbursement } from '../../types/finance';
import { canManageFundraisers } from '../../config/permissions';
import { parseApiError } from '../../lib/api-errors';
import { formatINR, formatDate } from '../../lib/formatters';
import { Modal } from '../../components/ui/Modal';
import {
  DollarSign,
  Heart,
  Plus,
  Target,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Users,
  Download,
  Calendar,
  Layers,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Receipt,
  QrCode,
  ShieldCheck,
  Check,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

export function FundraisersPage() {
  const { user, isAuthenticated } = useAuth();
  const isStaff = canManageFundraisers(user);

  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [total, setTotal] = useState(0);
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // POS State
  const [cashTotal, setCashTotal] = useState(0);
  const [digitalTotal, setDigitalTotal] = useState(0);
  const [lastTx, setLastTx] = useState<string>('No sales logged yet');

  // Task Filter State
  const [taskFilter, setTaskFilter] = useState<'all' | 'baking' | 'supplies' | 'logistics'>('all');

  // Contribute / Donate Modal
  const [donateTarget, setDonateTarget] = useState<Fundraiser | null>(null);
  const [donorName, setDonorName] = useState(user?.name || '');
  const [donorEmail, setDonorEmail] = useState(user?.email || '');
  const [donateAmount, setDonateAmount] = useState(500);
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
  const [createdContribution, setCreatedContribution] = useState<FundraiserContribution | null>(null);

  // Staff: Create Fundraiser Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fPurpose, setFPurpose] = useState('');
  const [fGoal, setFGoal] = useState(25000);
  const [fBeneficiary, setFBeneficiary] = useState('');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  // Staff: View Campaign Contributions & Summary Modal
  const [inspectSummary, setInspectSummary] = useState<FundraiserSummary | null>(null);
  const [campaignContributions, setCampaignContributions] = useState<FundraiserContribution[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [res, volRes, reimbRes] = await Promise.allSettled([
        fundraisersService.listFundraisers(),
        volunteersService.listOpportunities({ limit: 6 }),
        isStaff ? reimbursementsService.listReimbursements({ limit: 4 }) : reimbursementsService.getMyReimbursements(),
      ]);

      if (res.status === 'fulfilled') {
        setFundraisers(res.value.fundraisers || []);
        setTotal(res.value.total || 0);
      }
      if (volRes.status === 'fulfilled') {
        setOpportunities(volRes.value.opportunities || []);
      }
      if (reimbRes.status === 'fulfilled') {
        if ('reimbursements' in reimbRes.value) {
          setReimbursements(reimbRes.value.reimbursements || []);
        } else if (Array.isArray(reimbRes.value)) {
          setReimbursements(reimbRes.value);
        }
      }
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsLoading(false);
    }
  }, [isStaff]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Donation Submission
  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donateTarget) return;

    setIsSubmittingDonation(true);
    setFeedback(null);

    try {
      const res = await fundraisersService.createContribution(donateTarget.id, {
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim(),
        amount: Number(donateAmount),
      });

      setCreatedContribution(res.contribution);
      setFeedback({
        type: 'success',
        message: `Contribution order generated for ${formatINR(res.contribution.amount)}. Complete payment to record.`,
      });
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsSubmittingDonation(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!donateTarget || !createdContribution) return;
    setIsSubmittingDonation(true);
    try {
      await fundraisersService.verifyContribution({
        contributionId: createdContribution.id,
        razorpayOrderId: createdContribution.razorpayOrderId || `order_${createdContribution.id}`,
        razorpayPaymentId: `pay_sim_${Date.now()}`,
        razorpaySignature: 'sig_valid_simulated',
      });
      setFeedback({
        type: 'success',
        message: 'Contribution confirmed! Treasury deposit logged.',
      });
      setCreatedContribution(null);
      setDonateTarget(null);
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsSubmittingDonation(false);
    }
  };

  const handleCreateFundraiser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCampaign(true);
    setFeedback(null);

    try {
      await fundraisersService.createFundraiser({
        title: fTitle.trim(),
        description: fDesc.trim(),
        goalAmount: Number(fGoal),
        purpose: fPurpose.trim() || undefined,
        beneficiary: fBeneficiary.trim() || undefined,
      });

      setIsCreateOpen(false);
      setFTitle('');
      setFDesc('');
      setFPurpose('');
      setFBeneficiary('');
      setFeedback({
        type: 'success',
        message: 'Campaign created successfully! Review and publish.',
      });
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleInspectCampaign = async (f: Fundraiser) => {
    setSummaryLoading(true);
    try {
      const [sum, contribs] = await Promise.all([
        fundraisersService.getSummary(f.id),
        fundraisersService.listContributions(f.id),
      ]);
      setInspectSummary(sum);
      setCampaignContributions(contribs.contributions || []);
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setSummaryLoading(false);
    }
  };

  const handlePosAdd = (item: string, price: number, isDigital: boolean) => {
    if (isDigital) {
      setDigitalTotal((prev) => prev + price);
    } else {
      setCashTotal((prev) => prev + price);
    }
    const method = isDigital ? 'Digital/NFC' : 'Cash';
    setLastTx(`Just now (+$${price.toFixed(2)} ${method})`);
    setFeedback({
      type: 'success',
      message: `Logged ${item} (+$${price.toFixed(2)} ${method}) into live table balance!`,
    });
  };

  const grandBalance = cashTotal + digitalTotal;
  const totalGoal = fundraisers.reduce((sum, f) => sum + f.goalAmount, 0);
  const totalRaised = fundraisers.reduce((sum, f) => sum + (f.collectedAmount || f.totalRaised || 0), 0);
  const overallProgress = totalGoal > 0 ? Math.min(100, Math.round((totalRaised / totalGoal) * 100)) : 0;
  const totalDonors = fundraisers.reduce((sum, f) => sum + (f.donorCount || 0), 0);
  const activeCount = fundraisers.filter((f) => f.status === 'ACTIVE').length;

  return (
    <div className="flex flex-col w-full pb-16 space-y-6">
      {/* Top Header Banner & Context Bar */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex items-center gap-1.5 text-[#8e8fa3] light:text-slate-500 text-xs tracking-wide">
          <span className="hover:text-[#d4e4fa] light:hover:text-slate-900 transition-colors cursor-pointer">Operations</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="hover:text-[#d4e4fa] light:hover:text-slate-900 transition-colors cursor-pointer">Fundraiser & Tasks</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#b9c3ff] light:text-indigo-600 font-medium">Spring Quad Bake Sale 2026</span>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-1">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold font-headline text-[#d4e4fa] light:text-slate-900 tracking-tight">
                Quad Bake Sale & Volunteer Dispatch
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#006e4b] text-[#67f4b7] font-semibold">
                Live Booth
              </span>
            </div>
            <p className="text-sm text-[#c4c5da] light:text-slate-600 mt-1">
              Real-time task delegation, shift signups, baking commitments & live cashbox tracker for Spring 2026 club fundraiser.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => {
                setFeedback({ type: 'success', message: 'Generating printable PDF run-sheet...' });
              }}
              type="button"
              className="h-[38px] px-3.5 rounded-lg bg-[#1c2b3c] light:bg-slate-100 hover:bg-[#273647] light:hover:bg-slate-200 text-[#d4e4fa] light:text-slate-900 border border-[#273647]/60 light:border-slate-200 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
            >
              <Download className="w-4 h-4 text-[#8e8fa3] light:text-slate-500" />
              <span>Run-Sheet (PDF)</span>
            </button>
            <button
              onClick={() => {
                document.getElementById('pos-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              type="button"
              className="h-[38px] px-3.5 rounded-lg bg-[#1c2b3c] light:bg-slate-100 hover:bg-[#273647] light:hover:bg-slate-200 text-[#d4e4fa] light:text-slate-900 border border-[#273647]/60 light:border-slate-200 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
            >
              <CreditCard className="w-4 h-4 text-[#4edea3]" />
              <span>Log Table Sale</span>
            </button>
            <Link
              to="/volunteers"
              className="h-[38px] px-3.5 rounded-lg bg-[#1c2b3c] light:bg-slate-100 hover:bg-[#273647] light:hover:bg-slate-200 text-[#d4e4fa] light:text-slate-900 border border-[#273647]/60 light:border-slate-200 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
            >
              <Users className="w-4 h-4 text-[#7bd0ff]" />
              <span>Volunteer Roster</span>
            </Link>
            {isStaff && (
              <button
                onClick={() => setIsCreateOpen(true)}
                type="button"
                className="h-[38px] px-4 rounded-lg bg-[#0047ff] hover:bg-[#0047ff]/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Create Campaign</span>
              </button>
            )}
          </div>
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

      {/* KPI Metric Summary Bar (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-xl bg-[#122131] light:bg-white border border-[#273647]/60 light:border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-[#8e8fa3] light:text-slate-500 font-semibold">
                Target Revenue
              </span>
              <div className="flex items-baseline gap-1 mt-1 font-mono">
                <span className="text-2xl text-[#d4e4fa] light:text-slate-900 font-bold">
                  {formatINR(totalRaised)}
                </span>
                <span className="text-xs text-[#8e8fa3] light:text-slate-500">/ {formatINR(totalGoal)}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#0047ff]/20 flex items-center justify-center text-[#b9c3ff] light:text-indigo-600">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#273647]/40 light:border-slate-200">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-[#b9c3ff] light:text-indigo-600 font-medium">{overallProgress}% Reached</span>
              <span className="text-[#8e8fa3] light:text-slate-500 font-mono">{activeCount} Active</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#1c2b3c] light:bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-[#0047ff]" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-xl bg-[#122131] light:bg-white border border-[#273647]/60 light:border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-[#8e8fa3] light:text-slate-500 font-semibold">
                Volunteer Operations
              </span>
              <div className="flex items-baseline gap-1 mt-1 font-mono">
                <span className="text-2xl text-[#d4e4fa] light:text-slate-900 font-bold">{opportunities.length}</span>
                <span className="text-xs text-[#8e8fa3] light:text-slate-500">Active Shifts</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#006e4b]/30 flex items-center justify-center text-[#4edea3]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#273647]/40 light:border-slate-200 flex items-center justify-between text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-[#006e4b] text-[#67f4b7] font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {opportunities.reduce((sum, o) => sum + o.registeredCount, 0)} Registrations
            </span>
            <span className="text-[#8e8fa3] light:text-slate-500">Live Operations</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-xl bg-[#122131] light:bg-white border border-[#273647]/60 light:border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-[#8e8fa3] light:text-slate-500 font-semibold">
                Backers & Donors
              </span>
              <div className="flex items-baseline gap-1 mt-1 font-mono">
                <span className="text-2xl text-[#d4e4fa] light:text-slate-900 font-bold">{totalDonors}</span>
                <span className="text-xs text-[#8e8fa3] light:text-slate-500">verified donors</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#1c2b3c] light:bg-slate-100 flex items-center justify-center text-[#7bd0ff]">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#273647]/40 light:border-slate-200 flex items-center justify-between text-[11px]">
            <span className="text-[#7bd0ff] font-medium">{activeCount} Campaigns Active</span>
            <span className="text-[#8e8fa3] light:text-slate-500 font-mono">{fundraisers.length} Total</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-xl bg-[#122131] light:bg-white border border-[#273647]/60 light:border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-[#8e8fa3] light:text-slate-500 font-semibold">
                Table Register Balance
              </span>
              <div className="flex items-baseline gap-1 mt-1 font-mono">
                <span className="text-2xl text-[#4edea3] font-bold">
                  {formatINR(grandBalance)}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#1c2b3c] light:bg-slate-100 flex items-center justify-center text-[#b9c3ff] light:text-indigo-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#273647]/40 light:border-slate-200 flex items-center justify-between text-xs font-mono text-[#c4c5da] light:text-slate-600">
            <span>Cash: <strong className="text-[#d4e4fa] light:text-slate-900">{formatINR(cashTotal)}</strong></span>
            <span className="text-[#8e8fa3] light:text-slate-500">|</span>
            <span>Digital: <strong className="text-[#d4e4fa] light:text-slate-900">{formatINR(digitalTotal)}</strong></span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tasks & Volunteer Schedule (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Active Campaigns Board (Backend API Data) */}
          <section className="bg-[#122131] light:bg-white border border-[#273647]/60 light:border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#273647]/40 light:border-slate-200">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#b9c3ff] light:text-indigo-600" />
                <h2 className="text-base font-bold font-headline text-[#d4e4fa] light:text-slate-900">
                  Active Fundraising Campaigns
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1c2b3c] light:bg-slate-100 text-[#c4c5da] light:text-slate-600 font-mono">
                  {fundraisers.length} Total
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="p-4 text-center text-xs text-[#8e8fa3] light:text-slate-500">
                  Loading registered campaigns...
                </div>
              ) : fundraisers.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#8e8fa3] light:text-slate-500 bg-[#010f1f] light:bg-white rounded-lg">
                  No active campaigns found. Create one using the button above!
                </div>
              ) : (
                fundraisers.map((f) => {
                  const pct = Math.min(
                    100,
                    Math.round(((f.totalRaised || 0) / (f.goalAmount || 1)) * 100)
                  );
                  return (
                    <div
                      key={f.id}
                      className="p-4 rounded-lg bg-[#1c2b3c] light:bg-slate-100 border border-[#273647]/50 light:border-slate-200 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#d4e4fa] light:text-slate-900">{f.title}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                f.status === 'ACTIVE'
                                  ? 'bg-[#006e4b] text-[#67f4b7]'
                                  : 'bg-[#122131] light:bg-white text-[#8e8fa3] light:text-slate-500'
                              }`}
                            >
                              {f.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#c4c5da] light:text-slate-600 mt-0.5">{f.description}</p>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {isStaff && (
                            <button
                              onClick={() => handleInspectCampaign(f)}
                              className="px-2.5 py-1.5 rounded bg-[#122131] light:bg-white hover:bg-[#273647] light:hover:bg-slate-200 text-[#d4e4fa] light:text-slate-900 text-xs font-medium"
                            >
                              Audit
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setDonateTarget(f);
                              setCreatedContribution(null);
                            }}
                            className="px-3.5 py-1.5 rounded bg-[#0047ff] hover:bg-[#0047ff]/90 text-white text-xs font-semibold shadow-sm"
                          >
                            Contribute
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[#4edea3]">
                            {formatINR(f.totalRaised || 0)} raised
                          </span>
                          <span className="text-[#8e8fa3] light:text-slate-500">
                            Goal: {formatINR(f.goalAmount)} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#122131] light:bg-white overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#0047ff]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Component A: Operational Tasks & Volunteer Pipeline */}
          <section className="bg-[#122131] light:bg-white border border-[#273647]/60 light:border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#273647]/40 light:border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold font-headline text-[#d4e4fa] light:text-slate-900">
                    Operational Tasks & Volunteer Shifts
                  </h2>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1c2b3c] light:bg-slate-100 text-[#c4c5da] light:text-slate-600 font-mono">
                    {opportunities.length} Listed
                  </span>
                </div>
                <p className="text-xs text-[#c4c5da] light:text-slate-600 mt-0.5">
                  Live operational commitments, booth support, and supply tasks.
                </p>
              </div>

              <Link to="/volunteers" className="text-xs text-[#0047FF] hover:underline font-semibold flex items-center">
                Manage All Tasks ({opportunities.length}) →
              </Link>
            </div>

            {/* Task Item Cards */}
            <div className="flex flex-col gap-2.5">
              {opportunities.length > 0 ? (
                opportunities.map((opp) => (
                  <div key={opp.id} className="flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-lg bg-[#1c2b3c] light:bg-slate-100 border border-[#273647]/50 light:border-slate-200 gap-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#006e4b]/30 text-[#4edea3] flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#d4e4fa] light:text-slate-900">
                          {opp.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8e8fa3] light:text-slate-500">
                          <span>{opp.location}</span>
                          <span>•</span>
                          <span>{opp.startsAt ? formatDate(opp.startsAt) : 'Upcoming'}</span>
                          <span>•</span>
                          <span className="text-[#4edea3] font-mono">{opp.registeredCount}/{opp.capacity} Staffed</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold self-end md:self-center ${
                      opp.status === 'PUBLISHED' ? 'bg-[#006e4b] text-[#67f4b7]' : 'bg-[#122131] light:bg-white text-[#7bd0ff] border border-[#273647] light:border-slate-200'
                    }`}>
                      {opp.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-[#8e8fa3] light:text-slate-500">
                  No operational volunteer tasks registered yet.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Inventory POS & Out-of-Pocket Reimbursements (4 cols) */}
        <div id="pos-section" className="lg:col-span-4 flex flex-col gap-6">
          {/* Component C: Baked Goods & Pricing Inventory + Live POS Counter */}
          <section className="bg-[#122131] light:bg-white border border-[#273647]/60 light:border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#273647]/40 light:border-slate-200">
              <h2 className="text-base font-bold font-headline text-[#d4e4fa] light:text-slate-900">
                Baked Goods Live POS
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#1c2b3c] light:bg-slate-100 text-[#4edea3] font-mono">
                Instant Tap
              </span>
            </div>
            <p className="text-xs text-[#c4c5da] light:text-slate-600 -mt-2">
              Tap item button to rapidly log a physical cash sale and update remaining inventory.
            </p>

            <div className="flex flex-col gap-2.5">
              {/* Item 1 */}
              <div className="p-3 rounded-lg bg-[#1c2b3c] light:bg-slate-100 border border-[#273647]/50 light:border-slate-200 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#d4e4fa] light:text-slate-900">Double Fudge Brownies</span>
                    <div className="font-mono text-xs text-[#7bd0ff]">$3.00 ea</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#93000a] text-[#ffdad6] font-semibold">
                    2 Left! (38/40 sold)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePosAdd('Double Fudge Brownie', 3.0, false)}
                    className="flex-1 h-8 rounded bg-[#122131] light:bg-white hover:bg-[#0047ff] hover:text-white text-[#d4e4fa] light:text-slate-900 text-xs font-medium flex items-center justify-center gap-1 transition-all active:scale-[0.97]"
                  >
                    <Plus className="w-3.5 h-3.5" /> +$3.00 (Cash)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePosAdd('Double Fudge Brownie', 3.0, true)}
                    className="h-8 px-3 rounded bg-[#273647] hover:bg-[#00a6e0] hover:text-white text-[#d4e4fa] light:text-slate-900 text-xs flex items-center justify-center transition-all active:scale-[0.97]"
                    title="Tap Digital (Square/Venmo)"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Item 2 */}
              <div className="p-3 rounded-lg bg-[#1c2b3c] light:bg-slate-100 border border-[#273647]/50 light:border-slate-200 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#d4e4fa] light:text-slate-900">Choc Chip Cookies</span>
                    <div className="font-mono text-xs text-[#7bd0ff]">$2.00 ea (3 for $5.00)</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#122131] light:bg-white text-[#c4c5da] light:text-slate-600 font-semibold">
                    12 Left (48/60 sold)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePosAdd('Choc Chip Cookie', 2.0, false)}
                    className="flex-1 h-8 rounded bg-[#122131] light:bg-white hover:bg-[#0047ff] hover:text-white text-[#d4e4fa] light:text-slate-900 text-xs font-medium flex items-center justify-center gap-1 transition-all active:scale-[0.97]"
                  >
                    <Plus className="w-3.5 h-3.5" /> +$2.00 (1x)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePosAdd('Choc Chip Cookie Trio', 5.0, false)}
                    className="flex-1 h-8 rounded bg-[#122131] light:bg-white hover:bg-[#0047ff] hover:text-white text-[#d4e4fa] light:text-slate-900 text-xs font-medium flex items-center justify-center gap-1 transition-all active:scale-[0.97]"
                  >
                    <Plus className="w-3.5 h-3.5" /> +$5.00 (3x)
                  </button>
                </div>
              </div>

              {/* Item 3 */}
              <div className="p-3 rounded-lg bg-[#1c2b3c] light:bg-slate-100 border border-[#273647]/50 light:border-slate-200 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#d4e4fa] light:text-slate-900">Vegan Blueberry Muffins</span>
                    <div className="font-mono text-xs text-[#7bd0ff]">$3.50 ea</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#122131] light:bg-white text-[#c4c5da] light:text-slate-600 font-semibold">
                    7 Left (18/25 sold)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePosAdd('Vegan Blueberry Muffin', 3.5, false)}
                    className="flex-1 h-8 rounded bg-[#122131] light:bg-white hover:bg-[#0047ff] hover:text-white text-[#d4e4fa] light:text-slate-900 text-xs font-medium flex items-center justify-center gap-1 transition-all active:scale-[0.97]"
                  >
                    <Plus className="w-3.5 h-3.5" /> +$3.50 (Cash)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePosAdd('Vegan Blueberry Muffin', 3.5, true)}
                    className="h-8 px-3 rounded bg-[#273647] hover:bg-[#00a6e0] hover:text-white text-[#d4e4fa] light:text-slate-900 text-xs flex items-center justify-center transition-all active:scale-[0.97]"
                    title="Tap Digital"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#010f1f] light:bg-white flex items-center justify-between text-xs text-[#c4c5da] light:text-slate-600">
              <span>Last logged transaction:</span>
              <span className="font-mono text-[#d4e4fa] light:text-slate-900">{lastTx}</span>
            </div>
          </section>

          {/* Component D: Expense & Reimbursement Tracker */}
          <section className="bg-[#122131] light:bg-white border border-[#273647]/60 light:border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#273647]/40 light:border-slate-200">
              <div>
                <h2 className="text-base font-bold font-headline text-[#d4e4fa] light:text-slate-900">
                  Out-of-Pocket Receipts
                </h2>
                <p className="text-xs text-[#c4c5da] light:text-slate-600 mt-0.5">Submitted volunteer disbursements.</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-[#8e8fa3] light:text-slate-500 block">
                  Total Claims
                </span>
                <span className="text-sm font-bold text-[#d4e4fa] light:text-slate-900 font-mono">
                  {formatINR(reimbursements.reduce((sum, r) => sum + r.amount, 0))}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {reimbursements.length > 0 ? (
                reimbursements.map((r) => (
                  <div key={r.id} className="p-2.5 rounded-lg bg-[#1c2b3c] light:bg-slate-100 border border-[#273647]/50 light:border-slate-200 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#d4e4fa] light:text-slate-900">
                      <span className="truncate">{r.notes || 'Disbursement Claim'}</span>
                      <span className="font-mono text-[#4edea3]">{formatINR(r.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#c4c5da] light:text-slate-600">
                      <span>{r.expense?.category || 'General Claim'} • {formatDate(r.createdAt)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        r.status === 'SETTLED' ? 'bg-[#006e4b] text-[#67f4b7]' : 'bg-[#122131] light:bg-white text-[#7bd0ff] border border-[#273647] light:border-slate-200'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-[#8e8fa3] light:text-slate-500">
                  No reimbursement receipts filed.
                </div>
              )}
            </div>

            <Link
              to="/treasury"
              className="w-full h-[38px] rounded-lg bg-[#1c2b3c] light:bg-slate-100 hover:bg-[#273647] light:hover:bg-slate-200 text-[#d4e4fa] light:text-slate-900 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Receipt className="w-4 h-4" />
              <span>Submit Supply Receipt in Treasury</span>
            </Link>
          </section>
        </div>
      </div>

      {/* Donation Modal */}
      {donateTarget && (
        <Modal
          isOpen={true}
          onClose={() => {
            setDonateTarget(null);
            setCreatedContribution(null);
          }}
          title={`Contribute to "${donateTarget.title}"`}
        >
          <div className="space-y-4">
            {!createdContribution ? (
              <form onSubmit={handleDonate} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#c4c5da] light:text-slate-600 mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full h-9 px-3 bg-[#1c2b3c] light:bg-slate-100 border border-[#273647] light:border-slate-200 rounded-lg text-xs text-[#d4e4fa] light:text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#c4c5da] light:text-slate-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full h-9 px-3 bg-[#1c2b3c] light:bg-slate-100 border border-[#273647] light:border-slate-200 rounded-lg text-xs text-[#d4e4fa] light:text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#c4c5da] light:text-slate-600 mb-1">
                    Contribution Amount (INR)
                  </label>
                  <input
                    type="number"
                    min={10}
                    step={10}
                    required
                    value={donateAmount}
                    onChange={(e) => setDonateAmount(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-[#1c2b3c] light:bg-slate-100 border border-[#273647] light:border-slate-200 rounded-lg text-xs text-[#d4e4fa] light:text-slate-900 font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDonateTarget(null)}
                    className="px-3 py-1.5 rounded-lg bg-[#1c2b3c] light:bg-slate-100 text-xs text-[#c4c5da] light:text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDonation}
                    className="px-4 py-1.5 rounded-lg bg-[#0047ff] hover:bg-[#0047ff]/90 text-white text-xs font-semibold"
                  >
                    {isSubmittingDonation ? 'Processing...' : 'Proceed to Payment'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="p-4 rounded-xl bg-[#010f1f] light:bg-white border border-[#273647] light:border-slate-200 space-y-2">
                  <span className="text-xs text-[#8e8fa3] light:text-slate-500">Order ID: {createdContribution.id}</span>
                  <div className="text-2xl font-bold font-mono text-[#4edea3]">
                    {formatINR(createdContribution.amount)}
                  </div>
                  <p className="text-xs text-[#c4c5da] light:text-slate-600">
                    Razorpay Gateway Verification Ready
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSubmittingDonation}
                  onClick={handleSimulatePayment}
                  className="w-full py-2 rounded-lg bg-[#0047ff] hover:bg-[#0047ff]/90 text-white text-xs font-semibold shadow-md"
                >
                  {isSubmittingDonation ? 'Verifying...' : 'Simulate Successful Razorpay Payment'}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create Fundraiser Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateOpen(false)}
          title="Create New Fundraising Campaign"
        >
          <form onSubmit={handleCreateFundraiser} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#c4c5da] light:text-slate-600 mb-1">
                Campaign Title
              </label>
              <input
                type="text"
                required
                value={fTitle}
                onChange={(e) => setFTitle(e.target.value)}
                placeholder="e.g. Quad Bake Sale 2026"
                className="w-full h-9 px-3 bg-[#1c2b3c] light:bg-slate-100 border border-[#273647] light:border-slate-200 rounded-lg text-xs text-[#d4e4fa] light:text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c4c5da] light:text-slate-600 mb-1">Description</label>
              <textarea
                required
                rows={3}
                value={fDesc}
                onChange={(e) => setFDesc(e.target.value)}
                placeholder="Explain the purpose of this fundraiser..."
                className="w-full p-2.5 bg-[#1c2b3c] light:bg-slate-100 border border-[#273647] light:border-slate-200 rounded-lg text-xs text-[#d4e4fa] light:text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c4c5da] light:text-slate-600 mb-1">
                Target Amount (INR)
              </label>
              <input
                type="number"
                min={100}
                required
                value={fGoal}
                onChange={(e) => setFGoal(Number(e.target.value))}
                className="w-full h-9 px-3 bg-[#1c2b3c] light:bg-slate-100 border border-[#273647] light:border-slate-200 rounded-lg text-xs text-[#d4e4fa] light:text-slate-900 font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-[#1c2b3c] light:bg-slate-100 text-xs text-[#c4c5da] light:text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingCampaign}
                className="px-4 py-1.5 rounded-lg bg-[#0047ff] hover:bg-[#0047ff]/90 text-white text-xs font-semibold"
              >
                {isCreatingCampaign ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Inspect Campaign Summary Modal */}
      {inspectSummary && (
        <Modal
          isOpen={true}
          onClose={() => setInspectSummary(null)}
          title="Campaign Audit & Contributions"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#1c2b3c] light:bg-slate-100">
                <span className="text-[11px] text-[#8e8fa3] light:text-slate-500 block">Total Raised</span>
                <span className="text-lg font-bold font-mono text-[#4edea3]">
                  {formatINR(inspectSummary.collectedAmount ?? inspectSummary.totalVerifiedAmount ?? 0)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#1c2b3c] light:bg-slate-100">
                <span className="text-[11px] text-[#8e8fa3] light:text-slate-500 block">Donor Count</span>
                <span className="text-lg font-bold font-mono text-[#d4e4fa] light:text-slate-900">
                  {inspectSummary.donorCount ?? inspectSummary.contributionCount ?? 0}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#d4e4fa] light:text-slate-900">Contribution Ledger</h4>
              {campaignContributions.length === 0 ? (
                <p className="text-xs text-[#8e8fa3] light:text-slate-500">No contributions logged yet.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {campaignContributions.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 rounded bg-[#010f1f] light:bg-white flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="text-[#d4e4fa] light:text-slate-900 font-medium">{c.donorName}</span>
                        <span className="text-[#8e8fa3] light:text-slate-500 text-[10px] ml-2">
                          {formatDate(c.createdAt)}
                        </span>
                      </div>
                      <span className="text-[#4edea3] font-mono font-semibold">
                        {formatINR(c.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
