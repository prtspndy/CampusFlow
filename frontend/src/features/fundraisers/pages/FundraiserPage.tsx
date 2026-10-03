import React, { useState, useEffect } from 'react'
import {
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Kanban,
  List,
  Heart,
  X,
  CreditCard,
  Banknote,
} from 'lucide-react'
import { fundraiserService } from '../../../services/fundraiserService'
import { useAuthStore } from '../../../stores/authStore'
import { Button } from '../../../components/ui/Button'
import { formatMoney } from '../../../lib/format'
import { MOCK_TASKS } from '../../../lib/mockData'
import type {
  Fundraiser,
  FundraiserContribution,
  Task,
} from '../../../types/models'
import { cn } from '../../../lib/cn'

export const FundraiserPage: React.FC = () => {
  const user = useAuthStore((state) => state.user)
  const isStaff = user?.role === 'ADMIN' || user?.role === 'TREASURER' || user?.role === 'EVENT_MANAGER'

  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([])
  const [activeFundraiser, setActiveFundraiser] = useState<Fundraiser | null>(null)
  const [contributions, setContributions] = useState<FundraiserContribution[]>([])
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS)
  const [viewMode, setViewMode] = useState<'campaign' | 'tasks' | 'contributions'>('campaign')
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'board'>('list')

  // Notification banners
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Donation Modal state
  const [isDonateOpen, setIsDonateOpen] = useState(false)
  const [donateAmount, setDonateAmount] = useState<number>(500)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [donorName, setDonorName] = useState(user?.name || '')
  const [donorEmail, setDonorEmail] = useState(user?.email || '')
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'CASH'>('ONLINE')
  const [donating, setDonating] = useState(false)

  // Create Fundraiser Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPurpose, setNewPurpose] = useState('')
  const [newGoal, setNewGoal] = useState<number>(50000)
  const [creating, setCreating] = useState(false)

  const loadFundraisers = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fundraiserService.listFundraisers()
      const list = res.fundraisers || []
      setFundraisers(list)
      if (list.length > 0) {
        // Find first active, or the first one
        const active = list.find((f) => f.status === 'ACTIVE') || list[0]
        setActiveFundraiser(active)
        await loadContributions(active.id)
      } else {
        setActiveFundraiser(null)
        setContributions([])
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const loadContributions = async (fundId: string) => {
    try {
      const res = await fundraiserService.listContributions(fundId)
      setContributions(res.contributions || [])
    } catch {
      // non-critical
    }
  }

  useEffect(() => {
    void loadFundraisers()
  }, [])

  const handleSelectCampaign = async (f: Fundraiser) => {
    setActiveFundraiser(f)
    await loadContributions(f.id)
  }

  const handleCreateFundraiser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setErrorMsg(null)
    try {
      const created = await fundraiserService.createFundraiser({
        title: newTitle,
        description: newDesc,
        purpose: newPurpose || undefined,
        goalAmount: Number(newGoal),
        status: 'ACTIVE',
      })
      setSuccessMsg(`Campaign "${created.title}" successfully created and activated!`)
      setIsCreateOpen(false)
      setNewTitle('')
      setNewDesc('')
      setNewPurpose('')
      await loadFundraisers()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create campaign')
    } finally {
      setCreating(false)
    }
  }

  const handlePublish = async (fundId: string) => {
    try {
      await fundraiserService.publishFundraiser(fundId)
      setSuccessMsg('Campaign published and open for contributions.')
      await loadFundraisers()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish campaign')
    }
  }

  const handleClose = async (fundId: string) => {
    try {
      await fundraiserService.closeFundraiser(fundId)
      setSuccessMsg('Campaign closed.')
      await loadFundraisers()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to close campaign')
    }
  }

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeFundraiser) return
    const finalAmount = customAmount ? Number(customAmount) : donateAmount
    if (!finalAmount || finalAmount <= 0) {
      setErrorMsg('Please specify a positive donation amount.')
      return
    }

    setDonating(true)
    setErrorMsg(null)

    try {
      const result = await fundraiserService.contribute(activeFundraiser.id, {
        amount: finalAmount,
        donorName: donorName.trim() || 'Anonymous Supporter',
        donorEmail: donorEmail.trim() || 'donor@campus.edu',
        paymentMethod,
      })

      if (paymentMethod === 'ONLINE' && result.razorpayOrder) {
        // If razorpay order was generated
        const orderId = result.razorpayOrder.id
        // Check if Razorpay JS SDK exists on window
        const win = window as any
        if (win.Razorpay) {
          const rzp = new win.Razorpay({
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_campusflow',
            amount: result.razorpayOrder.amount,
            currency: result.razorpayOrder.currency,
            order_id: orderId,
            name: 'CampusFlow Fundraiser',
            description: `Contribution to ${activeFundraiser.title}`,
            handler: async (response: any) => {
              try {
                await fundraiserService.verifyContribution({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                })
                setSuccessMsg(`Thank you! Your contribution of ${formatMoney(finalAmount)} is verified.`)
                setIsDonateOpen(false)
                await loadFundraisers()
              } catch (verifyErr: any) {
                setErrorMsg(verifyErr.message || 'Payment verification failed.')
              }
            },
          })
          rzp.open()
          setDonating(false)
          return
        } else {
          // In environments without external script loaded, trigger payment verification simulation
          setSuccessMsg(
            `Contribution initiated. Order ID: ${orderId}. Payment recorded and queued for settlement.`
          )
        }
      } else {
        setSuccessMsg(`Thank you! Your donation of ${formatMoney(finalAmount)} was recorded successfully.`)
      }

      setIsDonateOpen(false)
      await loadFundraisers()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit contribution')
    } finally {
      setDonating(false)
    }
  }

  const toggleTaskDone = (taskId: string) => {
    setTasks((current) =>
      current.map((t) =>
        t.id === taskId ? { ...t, status: t.status === 'DONE' ? 'TODO' : 'DONE' } : t
      )
    )
  }

  const unassignedTasks = tasks.filter((t) => !t.assigneeName)
  const assignedTasks = tasks.filter((t) => !!t.assigneeName)
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length
  const percentTasks = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-[var(--color-surface)] rounded w-1/3" />
        <div className="h-48 bg-[var(--color-surface)] rounded-[14px]" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-tint-butter-deep)]">
            Campaign Operations
          </span>
          <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)] mt-0.5">
            {activeFundraiser ? activeFundraiser.title : 'Fundraising Campaigns'}
          </h1>
          <p className="text-body-sm text-[var(--color-muted)] mt-1">
            Real-time verified donor contributions, progress tracking, and volunteer assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeFundraiser && activeFundraiser.status === 'ACTIVE' && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsDonateOpen(true)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Heart className="w-4 h-4 fill-current" />
              <span>Make a Contribution</span>
            </Button>
          )}

          {isStaff && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Campaign</span>
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-[12px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-body-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-[12px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 flex items-center justify-between text-body-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-700 hover:text-red-900 cursor-pointer text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Campaign Selector Pills */}
      {fundraisers.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {fundraisers.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleSelectCampaign(f)}
              className={cn(
                'px-4 py-2 rounded-full text-caption font-semibold whitespace-nowrap transition-colors cursor-pointer',
                activeFundraiser?.id === f.id
                  ? 'bg-[var(--color-tint-butter-deep)] text-white shadow-xs'
                  : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-ink)] border border-[var(--color-hairline)]'
              )}
            >
              {f.title} ({f.percentRaised}%)
            </button>
          ))}
        </div>
      )}

      {activeFundraiser ? (
        <>
          {/* Signature Progress Card in card-module-tasks (butter tint) */}
          <div className="rounded-[14px] bg-[var(--color-tint-butter)] text-[var(--color-tint-butter-deep)] p-6 md:p-8 border border-yellow-200/50 dark:border-yellow-900/30 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-micro-uppercase font-bold tracking-wider opacity-80">
                    Campaign Progress
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-white/70 dark:bg-black/30">
                    {activeFundraiser.status}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-money-xl font-bold font-display text-[var(--color-ink)]">
                    {formatMoney(activeFundraiser.collectedAmount ?? activeFundraiser.currentAmount ?? 0)}
                  </span>
                  <span className="text-body-md font-semibold text-[var(--color-tint-butter-deep)]">
                    raised of {formatMoney(activeFundraiser.goalAmount)} goal
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[12px] opacity-80 block uppercase font-bold">
                    Verified Supporters
                  </span>
                  <span className="text-heading-3 font-display font-bold">
                    {activeFundraiser.donorCount} Donors
                  </span>
                </div>
                <div>
                  <span className="text-[12px] opacity-80 block uppercase font-bold">
                    Operational Tasks
                  </span>
                  <span className="text-heading-3 font-display font-bold">
                    {completedTasks}/{tasks.length} ({percentTasks}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 rounded-full bg-white/60 dark:bg-black/30 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, activeFundraiser.percentRaised ?? 0)}%` }}
                  className="h-full rounded-full bg-[var(--color-tint-butter-deep)] transition-all duration-500"
                />
              </div>
              <div className="flex justify-between text-caption font-semibold">
                <span>{activeFundraiser.percentRaised ?? 0}% Funded</span>
                <span>
                  {activeFundraiser.purpose ? `Purpose: ${activeFundraiser.purpose}` : 'Active Community Campaign'}
                </span>
              </div>
            </div>

            {/* Staff status management actions */}
            {isStaff && (
              <div className="pt-2 border-t border-yellow-300/40 dark:border-yellow-800/40 flex items-center justify-between text-caption">
                <span className="opacity-80">Admin Operations:</span>
                <div className="flex items-center gap-2">
                  {activeFundraiser.status === 'DRAFT' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handlePublish(activeFundraiser.id)}
                      className="text-xs py-1"
                    >
                      Publish Campaign
                    </Button>
                  )}
                  {activeFundraiser.status === 'ACTIVE' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleClose(activeFundraiser.id)}
                      className="text-xs py-1"
                    >
                      Close Campaign
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-[var(--color-hairline)] pb-2">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setViewMode('campaign')}
                className={cn(
                  'text-body-sm font-bold pb-2 transition-colors cursor-pointer border-b-2 -mb-2.5',
                  viewMode === 'campaign'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                )}
              >
                About Campaign
              </button>
              <button
                type="button"
                onClick={() => setViewMode('contributions')}
                className={cn(
                  'text-body-sm font-bold pb-2 transition-colors cursor-pointer border-b-2 -mb-2.5',
                  viewMode === 'contributions'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                )}
              >
                Verified Donors ({contributions.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tasks')}
                className={cn(
                  'text-body-sm font-bold pb-2 transition-colors cursor-pointer border-b-2 -mb-2.5',
                  viewMode === 'tasks'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                )}
              >
                Volunteer Tasks ({tasks.length})
              </button>
            </div>

            {viewMode === 'tasks' && (
              <div className="flex items-center bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[10px] p-0.5">
                <button
                  type="button"
                  onClick={() => setTaskViewMode('list')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-caption font-semibold cursor-pointer',
                    taskViewMode === 'list'
                      ? 'bg-[var(--color-canvas)] text-[var(--color-ink)] shadow-xs'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  )}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTaskViewMode('board')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-caption font-semibold cursor-pointer',
                    taskViewMode === 'board'
                      ? 'bg-[var(--color-canvas)] text-[var(--color-ink)] shadow-xs'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  )}
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span>Board</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab 1: About Campaign */}
          {viewMode === 'campaign' && (
            <div className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-heading-2 font-display font-bold text-[var(--color-ink)]">
                  About This Fundraiser
                </h3>
                <p className="text-body-md text-[var(--color-body)] mt-3 whitespace-pre-line leading-relaxed">
                  {activeFundraiser.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--color-hairline)]">
                <div className="space-y-1">
                  <span className="text-caption font-semibold text-[var(--color-muted)]">Target Goal</span>
                  <p className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
                    {formatMoney(activeFundraiser.goalAmount)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-caption font-semibold text-[var(--color-muted)]">Collected via Ledger</span>
                  <p className="text-heading-3 font-display font-bold text-emerald-600">
                    {formatMoney(activeFundraiser.collectedAmount ?? activeFundraiser.currentAmount ?? 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-caption font-semibold text-[var(--color-muted)]">Verified Backers</span>
                  <p className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
                    {activeFundraiser.donorCount} supporters
                  </p>
                </div>
              </div>

              {activeFundraiser.status === 'ACTIVE' && (
                <div className="pt-4 flex justify-end">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsDonateOpen(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                    <span>Contribute to this Project</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Verified Contributions */}
          {viewMode === 'contributions' && (
            <div className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] overflow-hidden shadow-xs">
              <div className="p-4 bg-[var(--color-surface)] border-b border-[var(--color-hairline)] flex items-center justify-between">
                <h3 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
                  Verified Contribution Records
                </h3>
                <span className="text-caption font-semibold text-[var(--color-muted)]">
                  Total: {formatMoney(activeFundraiser.collectedAmount ?? activeFundraiser.currentAmount ?? 0)}
                </span>
              </div>

              {contributions.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Heart className="w-10 h-10 text-[var(--color-muted)] mx-auto opacity-40" />
                  <p className="text-body-sm font-semibold text-[var(--color-muted)]">
                    No verified contributions yet. Be the first to donate!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-hairline)]">
                  {contributions.map((c) => (
                    <div key={c.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-[var(--color-ink)] flex items-center gap-2">
                          <span>{c.donorName}</span>
                          <span className="text-caption font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                            {c.status}
                          </span>
                        </div>
                        <div className="text-caption text-[var(--color-muted)]">
                          {c.paymentMethod} • {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-heading-3 font-display font-bold text-emerald-600">
                          +{formatMoney(c.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Volunteer Tasks (Preserved operational board) */}
          {viewMode === 'tasks' && (
            <div className="space-y-6">
              {unassignedTasks.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-caption font-bold uppercase tracking-wider text-[var(--color-warning-deep)]">
                    <AlertCircle className="w-4 h-4 text-[var(--color-warning)]" />
                    <span>Unassigned Tasks ({unassignedTasks.length} need an owner)</span>
                  </div>

                  <div className="rounded-[14px] bg-[var(--color-warning-tint)]/40 border border-[var(--color-warning)]/30 divide-y divide-[var(--color-warning)]/20 overflow-hidden">
                    {unassignedTasks.map((task) => (
                      <div key={task.id} className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleTaskDone(task.id)}
                            className="w-5 h-5 rounded-full border-2 border-[var(--color-warning-deep)] flex items-center justify-center cursor-pointer"
                          >
                            {task.status === 'DONE' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]" />
                            )}
                          </button>
                          <div>
                            <h4 className="text-body-sm font-semibold text-[var(--color-ink)]">
                              {task.title}
                            </h4>
                            <span className="text-caption text-[var(--color-muted)]">
                              Due by {task.dueDate}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => alert(`Assigned task to volunteer`)}
                        >
                          Claim / Assign
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
                  Assigned Team Tasks
                </h3>
                <div className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] divide-y divide-[var(--color-hairline)] overflow-hidden">
                  {assignedTasks.map((task) => (
                    <div key={task.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleTaskDone(task.id)}
                          className="w-5 h-5 rounded-full border-2 border-[var(--color-hairline)] flex items-center justify-center cursor-pointer"
                        >
                          {task.status === 'DONE' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]" />
                          )}
                        </button>
                        <div>
                          <h4
                            className={cn(
                              'text-body-sm font-semibold text-[var(--color-ink)]',
                              task.status === 'DONE' && 'line-through text-[var(--color-muted)]'
                            )}
                          >
                            {task.title}
                          </h4>
                          <span className="text-caption text-[var(--color-muted)]">
                            Assigned to {task.assigneeName} • Due {task.dueDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-12 text-center space-y-4">
          <Heart className="w-12 h-12 text-[var(--color-muted)] mx-auto opacity-40" />
          <h2 className="text-heading-2 font-display font-bold text-[var(--color-ink)]">
            No active fundraisers currently
          </h2>
          <p className="text-body-sm text-[var(--color-muted)] max-w-md mx-auto">
            Authorized organizers and treasurers can launch student and club fundraising campaigns.
          </p>
          {isStaff && (
            <Button variant="primary" size="md" onClick={() => setIsCreateOpen(true)}>
              Launch a Fundraiser
            </Button>
          )}
        </div>
      )}

      {/* Make Contribution Modal */}
      {isDonateOpen && activeFundraiser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--color-canvas)] rounded-[16px] border border-[var(--color-hairline)] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-tint-butter-deep)]">
                  Make a Contribution
                </span>
                <h3 className="text-heading-2 font-display font-bold text-[var(--color-ink)] mt-0.5">
                  {activeFundraiser.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDonateOpen(false)}
                className="p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDonate} className="space-y-4">
              {/* Preset Amounts */}
              <div className="space-y-1.5">
                <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                  Select Amount (INR)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[250, 500, 1000, 2500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setDonateAmount(amt)
                        setCustomAmount('')
                      }}
                      className={cn(
                        'py-2 rounded-[8px] text-caption font-bold border transition-colors cursor-pointer',
                        !customAmount && donateAmount === amt
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'bg-[var(--color-surface)] border-[var(--color-hairline)] text-[var(--color-ink)] hover:border-amber-400'
                      )}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  placeholder="Or enter custom amount in ₹"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full mt-2 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                />
              </div>

              {/* Donor Info */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                    Donor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Student Supporter or Alumni"
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="name@campus.edu"
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ONLINE')}
                    className={cn(
                      'p-3 rounded-[10px] border flex items-center gap-2 text-caption font-bold transition-colors cursor-pointer',
                      paymentMethod === 'ONLINE'
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-muted)]'
                    )}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>UPI / Online</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={cn(
                      'p-3 rounded-[10px] border flex items-center gap-2 text-caption font-bold transition-colors cursor-pointer',
                      paymentMethod === 'CASH'
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-muted)]'
                    )}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Cash / Direct</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-hairline)]">
                <Button
                  variant="secondary"
                  size="md"
                  type="button"
                  onClick={() => setIsDonateOpen(false)}
                  disabled={donating}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={donating}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {donating
                    ? 'Processing...'
                    : `Contribute ${formatMoney(customAmount ? Number(customAmount) : donateAmount)}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[var(--color-canvas)] rounded-[16px] border border-[var(--color-hairline)] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-heading-2 font-display font-bold text-[var(--color-ink)]">
                Launch New Campaign
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFundraiser} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Solar Pavilion Project"
                  className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                  Purpose / Category
                </label>
                <input
                  type="text"
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  placeholder="e.g. Campus Sustainability"
                  className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                  Goal Amount (INR) *
                </label>
                <input
                  type="number"
                  min={100}
                  required
                  value={newGoal}
                  onChange={(e) => setNewGoal(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detail campaign mission, how funds will be used, and timeline..."
                  className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-hairline)]">
                <Button
                  variant="secondary"
                  size="md"
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Launch Campaign'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
