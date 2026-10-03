import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches render errors below it. Give it a `key` (for example the pathname)
 * so navigating away remounts it and clears the error.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[CampusFlow] Render error', error, info.componentStack)
  }

  private reset = () => this.setState({ error: null })

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div
        role="alert"
        className="mx-auto my-10 max-w-md rounded-[14px] border border-[var(--color-hairline)] bg-[var(--color-surface)] p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-error-tint)] text-[var(--color-error)]">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
          This page hit a problem
        </h2>
        <p className="mt-2 text-body-sm text-[var(--color-muted)]">
          The rest of CampusFlow is still working. Try loading this page again.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={this.reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      </div>
    )
  }
}
