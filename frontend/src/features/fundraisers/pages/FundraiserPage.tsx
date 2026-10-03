import React, { useState } from 'react'
import {
  User,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Kanban,
  List,
} from 'lucide-react'
import { MOCK_FUNDRAISER, MOCK_TASKS } from '../../../lib/mockData'
import { Button } from '../../../components/ui/Button'
import { formatMoney } from '../../../lib/format'
import type { Task, TaskStatus } from '../../../types/models'
import { cn } from '../../../lib/cn'

export const FundraiserPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS)
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')
  const fundraiser = MOCK_FUNDRAISER

  const percentRaised = Math.round(
    (fundraiser.currentAmount / fundraiser.goalAmount) * 100
  )
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length
  const percentTasks = Math.round((completedTasks / tasks.length) * 100)

  const toggleTaskDone = (taskId: string) => {
    setTasks((current) =>
      current.map((t) =>
        t.id === taskId
          ? { ...t, status: t.status === 'DONE' ? 'TODO' : 'DONE' }
          : t
      )
    )
  }

  // Separate Unassigned group at top per DESIGN.md
  const unassignedTasks = tasks.filter((t) => !t.assigneeName)
  const assignedTasks = tasks.filter((t) => !!t.assigneeName)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-tint-butter-deep)]">
            Campaign Operations
          </span>
          <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)] mt-0.5">
            {fundraiser.title}
          </h1>
          <p className="text-body-sm text-[var(--color-muted)] mt-1">
            Goal tracking, volunteer assignments, and task board.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[10px] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-caption font-semibold transition-colors cursor-pointer',
                viewMode === 'list'
                  ? 'bg-[var(--color-canvas)] text-[var(--color-ink)] shadow-xs'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              )}
            >
              <List className="w-4 h-4" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-caption font-semibold transition-colors cursor-pointer',
                viewMode === 'board'
                  ? 'bg-[var(--color-canvas)] text-[var(--color-ink)] shadow-xs'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              )}
            >
              <Kanban className="w-4 h-4" />
              <span>Board</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => alert('New volunteer task modal')}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Signature Progress Card in card-module-tasks (butter tint) per DESIGN.md */}
      <div className="rounded-[14px] bg-[var(--color-tint-butter)] text-[var(--color-tint-butter-deep)] p-6 md:p-8 border border-yellow-200/50 dark:border-yellow-900/30 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-micro-uppercase font-bold tracking-wider opacity-80 block mb-1">
              Fundraising Progress
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-money-xl font-bold font-display text-[var(--color-ink)]">
                {formatMoney(fundraiser.currentAmount)}
              </span>
              <span className="text-body-md font-semibold text-[var(--color-tint-butter-deep)]">
                raised of {formatMoney(fundraiser.goalAmount)} goal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-[12px] opacity-80 block uppercase font-bold">
                Supporters
              </span>
              <span className="text-heading-3 font-display font-bold">
                {fundraiser.donorCount} Donors
              </span>
            </div>
            <div>
              <span className="text-[12px] opacity-80 block uppercase font-bold">
                Tasks Completed
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
              style={{ width: `${percentRaised}%` }}
              className="h-full rounded-full bg-[var(--color-tint-butter-deep)] transition-all duration-500"
            />
          </div>
          <div className="flex justify-between text-caption font-semibold">
            <span>{percentRaised}% Funded</span>
            <span>Target Deadline: May 15, 2026</span>
          </div>
        </div>
      </div>

      {/* Tasks View: List or Kanban */}
      {viewMode === 'list' ? (
        <div className="space-y-6">
          {/* Unassigned Tasks Group Pinned at Top per DESIGN.md */}
          {unassignedTasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-caption font-bold uppercase tracking-wider text-[var(--color-warning-deep)]">
                <AlertCircle className="w-4 h-4 text-[var(--color-warning)]" />
                <span>Unassigned Tasks ({unassignedTasks.length} need an owner)</span>
              </div>

              <div className="rounded-[14px] bg-[var(--color-warning-tint)]/40 border border-[var(--color-warning)]/30 divide-y divide-[var(--color-warning)]/20 overflow-hidden">
                {unassignedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 flex items-center justify-between gap-4"
                  >
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
                        <h4 className="text-body-sm-medium font-semibold text-[var(--color-ink)]">
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
                      onClick={() => alert(`Assign task to volunteer`)}
                    >
                      Claim / Assign
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Tasks Table / List */}
          <div className="space-y-3">
            <h3 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
              Assigned Tasks ({assignedTasks.length})
            </h3>

            <div className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] divide-y divide-[var(--color-hairline)] overflow-hidden shadow-xs">
              {assignedTasks.map((task) => {
                const isDone = task.status === 'DONE'
                return (
                  <div
                    key={task.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--color-surface)]/60 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <button
                        type="button"
                        onClick={() => toggleTaskDone(task.id)}
                        className={cn(
                          'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer',
                          isDone
                            ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white'
                            : 'border-[var(--color-hairline-strong)] hover:border-[var(--color-primary)]'
                        )}
                      >
                        {isDone && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <div>
                        <h4
                          className={cn(
                            'text-body-sm-medium font-semibold transition-all',
                            isDone
                              ? 'line-through text-[var(--color-muted)]'
                              : 'text-[var(--color-ink)]'
                          )}
                        >
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-3 text-caption text-[var(--color-muted)] mt-0.5">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            <span>{task.assigneeName}</span>
                          </span>

                          <span>•</span>

                          {/* Overdue chip turns error-deep with icon per DESIGN.md */}
                          {task.isOverdue && !isDone ? (
                            <span className="inline-flex items-center gap-1 text-[var(--color-error-deep)] font-semibold">
                              <AlertCircle className="w-3 h-3 text-[var(--color-error)]" />
                              <span>Overdue ({task.dueDate})</span>
                            </span>
                          ) : (
                            <span>Due {task.dueDate}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-caption font-semibold text-[11px] uppercase tracking-wider',
                        isDone
                          ? 'bg-[var(--color-success-tint)] text-[var(--color-success-deep)]'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-[var(--color-primary-tint)] text-[var(--color-primary-deep)]'
                          : 'bg-[var(--color-surface-sunken)] text-[var(--color-muted)]'
                      )}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Kanban Board 3-column view */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['TODO', 'IN_PROGRESS', 'DONE'] as TaskStatus[]).map((status) => {
            const columnTasks = tasks.filter((t) => t.status === status)
            const titles: Record<TaskStatus, string> = {
              TODO: 'To Do',
              IN_PROGRESS: 'In Progress',
              DONE: 'Done',
            }
            return (
              <div
                key={status}
                className="rounded-[14px] bg-[var(--color-surface)] p-4 border border-[var(--color-hairline)] space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[var(--color-hairline)]">
                  <h4 className="text-body-sm-medium font-bold text-[var(--color-ink)]">
                    {titles[status]}
                  </h4>
                  <span className="text-caption font-bold px-2 py-0.5 rounded-full bg-[var(--color-surface-sunken)] text-[var(--color-muted)]">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {columnTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-[10px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] shadow-xs space-y-2 select-none"
                    >
                      <h5 className="text-body-sm font-semibold text-[var(--color-ink)]">
                        {t.title}
                      </h5>
                      <div className="flex items-center justify-between text-caption text-[var(--color-muted)]">
                        <span>{t.assigneeName || 'Unassigned'}</span>
                        {t.isOverdue && t.status !== 'DONE' ? (
                          <span className="text-[var(--color-error-deep)] font-semibold">
                            Overdue
                          </span>
                        ) : (
                          <span>{t.dueDate}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
