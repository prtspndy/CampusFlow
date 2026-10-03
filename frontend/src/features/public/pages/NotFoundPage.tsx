import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

export const NotFoundPage: React.FC = () => {
  const { pathname } = useLocation()

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-tint)] text-[var(--color-primary-deep)]">
        <Compass className="h-7 w-7" />
      </div>
      <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-sunset)]">
        404
      </span>
      <h1 className="mt-1 text-display-lg font-display font-extrabold tracking-tight text-[var(--color-ink)]">
        That page isn't here
      </h1>
      <p className="mt-3 text-body-md text-[var(--color-muted)]">
        Nothing lives at{' '}
        <code className="rounded bg-[var(--color-surface-sunken)] px-1.5 py-0.5 font-mono text-[13px] text-[var(--color-ink)]">
          {pathname}
        </code>
        . It may have moved, or the link had a typo.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/">
          <Button variant="primary">Back to home</Button>
        </Link>
        <Link to="/events">
          <Button variant="secondary">Browse events</Button>
        </Link>
      </div>
    </div>
  )
}
