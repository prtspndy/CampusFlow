import React, { useState, useEffect } from 'react'
import {
  PlusCircle,
  Edit2,
  Users,
  CheckCircle,
  MapPin,
  AlertCircle,
  X,
  UserCheck,
} from 'lucide-react'
import { volunteerService } from '../../../services/volunteerService'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/feedback/EmptyState'
import type {
  VolunteerOpportunity,
  VolunteerRegistration,
  VolunteerSignupStatus,
} from '../../../types/models'
import { cn } from '../../../lib/cn'

export const AdminVolunteerPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOpp, setEditingOpp] = useState<VolunteerOpportunity | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startsAt: '',
    endsAt: '',
    applicationDeadline: '',
    capacity: 10,
    category: 'Logistics',
    eligibility: '',
  })
  const [saving, setSaving] = useState(false)

  // Participants roster drawer state
  const [rosterOpp, setRosterOpp] = useState<VolunteerOpportunity | null>(null)
  const [participants, setParticipants] = useState<VolunteerRegistration[]>([])
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [attendanceNotes, setAttendanceNotes] = useState<Record<string, string>>({})

  const loadOpportunities = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await volunteerService.listOpportunities()
      setOpportunities(res.opportunities || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load opportunities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOpportunities()
  }, [])

  const handleOpenCreate = () => {
    setEditingOpp(null)
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 86400000)
    const endTomorrow = new Date(tomorrow.getTime() + 14400000)

    setFormData({
      title: '',
      description: '',
      location: '',
      startsAt: tomorrow.toISOString().slice(0, 16),
      endsAt: endTomorrow.toISOString().slice(0, 16),
      applicationDeadline: tomorrow.toISOString().slice(0, 16),
      capacity: 10,
      category: 'Logistics',
      eligibility: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (opp: VolunteerOpportunity) => {
    setEditingOpp(opp)
    setFormData({
      title: opp.title,
      description: opp.description,
      location: opp.location,
      startsAt: new Date(opp.startsAt).toISOString().slice(0, 16),
      endsAt: new Date(opp.endsAt).toISOString().slice(0, 16),
      applicationDeadline: opp.applicationDeadline
        ? new Date(opp.applicationDeadline).toISOString().slice(0, 16)
        : '',
      capacity: opp.capacity,
      category: opp.category || 'Logistics',
      eligibility: opp.eligibility || '',
    })
    setIsModalOpen(true)
  }

  const handleSaveOpportunity = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        startsAt: new Date(formData.startsAt).toISOString(),
        endsAt: new Date(formData.endsAt).toISOString(),
        applicationDeadline: formData.applicationDeadline
          ? new Date(formData.applicationDeadline).toISOString()
          : null,
        capacity: Number(formData.capacity),
        category: formData.category || undefined,
        eligibility: formData.eligibility || undefined,
      }

      if (editingOpp) {
        await volunteerService.updateOpportunity(editingOpp.id, payload)
        setSuccess(`Updated opportunity "${formData.title}"`)
      } else {
        await volunteerService.createOpportunity(payload)
        setSuccess(`Created new volunteer opportunity "${formData.title}"`)
      }

      setIsModalOpen(false)
      await loadOpportunities()
    } catch (err: any) {
      setError(err.message || 'Failed to save opportunity')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async (oppId: string) => {
    try {
      await volunteerService.publishOpportunity(oppId)
      setSuccess('Opportunity published to student community.')
      await loadOpportunities()
    } catch (err: any) {
      setError(err.message || 'Failed to publish opportunity')
    }
  }

  const handleClose = async (oppId: string) => {
    try {
      await volunteerService.closeOpportunity(oppId)
      setSuccess('Opportunity closed.')
      await loadOpportunities()
    } catch (err: any) {
      setError(err.message || 'Failed to close opportunity')
    }
  }

  const handleCancelOpp = async (oppId: string) => {
    if (!confirm('Are you sure you want to cancel this opportunity? Registrations will be halted.'))
      return
    try {
      await volunteerService.cancelOpportunity(oppId)
      setSuccess('Opportunity marked as cancelled.')
      await loadOpportunities()
    } catch (err: any) {
      setError(err.message || 'Failed to cancel opportunity')
    }
  }

  const handleOpenRoster = async (opp: VolunteerOpportunity) => {
    setRosterOpp(opp)
    setLoadingRoster(true)
    try {
      const res = await volunteerService.getParticipants(opp.id)
      setParticipants(res.participants || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load participants')
    } finally {
      setLoadingRoster(false)
    }
  }

  const handleMarkAttendance = async (signupId: string, status: VolunteerSignupStatus) => {
    try {
      const note = attendanceNotes[signupId]
      await volunteerService.updateAttendance(signupId, {
        status,
        attendanceNotes: note || undefined,
      })
      setSuccess(`Attendance marked as ${status}.`)
      if (rosterOpp) {
        const res = await volunteerService.getParticipants(rosterOpp.id)
        setParticipants(res.participants || [])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record attendance')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-primary)]">
            Coordinator Operations
          </span>
          <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)] mt-0.5">
            Volunteer Management
          </h1>
          <p className="text-body-sm text-[var(--color-muted)] mt-1">
            Create opportunities, manage sign-ups, and record verified student participation.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleOpenCreate} className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          <span>New Opportunity</span>
        </Button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-[12px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-body-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-[12px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 flex items-center justify-between text-body-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900 cursor-pointer text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Opportunities Table */}
      {loading ? (
        <div className="h-64 rounded-[14px] bg-[var(--color-surface)] animate-pulse" />
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No volunteer opportunities created"
          description="Create your first role to start accepting student volunteer registrations."
        />
      ) : (
        <div className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="bg-[var(--color-surface)] border-b border-[var(--color-hairline)] text-caption font-bold text-[var(--color-muted)] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Opportunity</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Timing</th>
                  <th className="py-3 px-4">Roster</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-hairline)]">
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-[var(--color-surface)]/50 transition-colors">
                    <td className="py-4 px-4 font-semibold text-[var(--color-ink)] max-w-xs">
                      <div>{opp.title}</div>
                      <div className="text-caption text-[var(--color-muted)] font-normal flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {opp.location}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[var(--color-muted)]">
                      <span className="text-caption px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-hairline)] font-medium">
                        {opp.category || 'General'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-caption text-[var(--color-muted)]">
                      <div>
                        {new Date(opp.startsAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div>
                        {new Date(opp.startsAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium">
                      <button
                        type="button"
                        onClick={() => handleOpenRoster(opp)}
                        className="flex items-center gap-1.5 text-[var(--color-primary)] hover:underline font-bold text-caption cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {opp.registeredCount} / {opp.capacity}
                        </span>
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          'text-caption font-bold px-2.5 py-1 rounded-full uppercase',
                          opp.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : opp.status === 'DRAFT'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : opp.status === 'CLOSED'
                            ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        )}
                      >
                        {opp.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenRoster(opp)}
                          title="Manage Attendance"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEdit(opp)}
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        {opp.status === 'DRAFT' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handlePublish(opp.id)}
                          >
                            Publish
                          </Button>
                        )}
                        {opp.status === 'PUBLISHED' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleClose(opp.id)}
                          >
                            Close
                          </Button>
                        )}
                        {opp.status !== 'CANCELLED' && opp.status !== 'CLOSED' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCancelOpp(opp.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[var(--color-canvas)] rounded-[16px] border border-[var(--color-hairline)] p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-heading-2 font-display font-bold text-[var(--color-ink)]">
                {editingOpp ? 'Edit Volunteer Opportunity' : 'New Volunteer Opportunity'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOpportunity} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                  Role Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Stage Sound Lead Assistant"
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe tasks, shift objectives, and requirements..."
                  className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Student Quad or Hall B"
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                  >
                    <option value="Logistics">Logistics</option>
                    <option value="Audio/Visual">Audio/Visual</option>
                    <option value="Guest Services">Guest Services</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Registration">Registration</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Safety">Safety</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endsAt}
                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                    Volunteer Capacity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                    Deadline (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.applicationDeadline}
                    onChange={(e) =>
                      setFormData({ ...formData, applicationDeadline: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                  Eligibility Criteria (Optional)
                </label>
                <input
                  type="text"
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  placeholder="e.g. Open to active club members with valid student badge"
                  className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-hairline)]">
                <Button
                  variant="secondary"
                  size="md"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingOpp ? 'Update Opportunity' : 'Create Opportunity'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participants Roster & Attendance Drawer */}
      {rosterOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl h-full bg-[var(--color-canvas)] border-l border-[var(--color-hairline)] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-hairline)]">
                <div>
                  <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-primary)]">
                    Participant Roster & Attendance
                  </span>
                  <h2 className="text-heading-2 font-display font-bold text-[var(--color-ink)] mt-1">
                    {rosterOpp.title}
                  </h2>
                  <p className="text-caption text-[var(--color-muted)]">
                    {rosterOpp.registeredCount} / {rosterOpp.capacity} registered volunteers
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRosterOpp(null)}
                  className="p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingRoster ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-24 bg-[var(--color-surface)] rounded-[12px] animate-pulse" />
                  ))}
                </div>
              ) : participants.length === 0 ? (
                <EmptyState
                  icon={<Users className="w-8 h-8" />}
                  title="No participants registered yet"
                  description="When members sign up for this opportunity, their attendance record will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {participants.map((reg) => (
                    <div
                      key={reg.id}
                      className="p-4 rounded-[12px] bg-[var(--color-surface)] border border-[var(--color-hairline)] space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-[var(--color-ink)]">
                            {reg.user?.name || 'Registered Student'}
                          </div>
                          <div className="text-caption text-[var(--color-muted)]">
                            {reg.user?.email} • Registered {new Date(reg.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <span
                          className={cn(
                            'text-caption font-bold px-2 py-0.5 rounded-full uppercase',
                            reg.status === 'ATTENDED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : reg.status === 'CANCELLED'
                              ? 'bg-zinc-100 text-zinc-600'
                              : reg.status === 'NO_SHOW'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          )}
                        >
                          {reg.status}
                        </span>
                      </div>

                      {reg.notes && (
                        <p className="text-caption text-[var(--color-muted)] italic">
                          Volunteer note: "{reg.notes}"
                        </p>
                      )}

                      {/* Attendance actions */}
                      <div className="pt-2 border-t border-[var(--color-hairline)] flex flex-wrap items-center justify-between gap-3">
                        <input
                          type="text"
                          placeholder="Attendance note / hours completed..."
                          value={attendanceNotes[reg.id] ?? reg.attendanceNotes ?? ''}
                          onChange={(e) =>
                            setAttendanceNotes({ ...attendanceNotes, [reg.id]: e.target.value })
                          }
                          className="flex-1 min-w-[200px] text-caption px-2.5 py-1.5 bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-[6px]"
                        />

                        <div className="flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleMarkAttendance(reg.id, 'ATTENDED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-xs py-1"
                          >
                            Mark Attended
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleMarkAttendance(reg.id, 'NO_SHOW')}
                            className="text-red-600 hover:text-red-700 text-xs py-1"
                          >
                            No Show
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleMarkAttendance(reg.id, 'EXCUSED')}
                            className="text-zinc-600 hover:text-zinc-700 text-xs py-1"
                          >
                            Excused
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[var(--color-hairline)] flex justify-end">
              <Button variant="secondary" size="md" onClick={() => setRosterOpp(null)}>
                Close Roster
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
