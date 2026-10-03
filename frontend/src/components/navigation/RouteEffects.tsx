import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { APP_NAME } from '../../lib/constants'

const TITLES: Array<[RegExp, string]> = [
  [/^\/$/, 'Home'],
  [/^\/events\/[^/]+$/, 'Event details'],
  [/^\/events$/, 'Events'],
  [/^\/shop\/[^/]+$/, 'Product'],
  [/^\/shop$/, 'Merch store'],
  [/^\/join$/, 'Join the club'],
  [/^\/login$/, 'Sign in'],
  [/^\/announcements$/, 'Announcements'],
  [/^\/member$/, 'Member home'],
  [/^\/member\/pass$/, 'Member pass'],
  [/^\/member\/tickets$/, 'My tickets'],
  [/^\/admin$/, 'Admin overview'],
  [/^\/admin\/members$/, 'Members'],
  [/^\/admin\/events$/, 'Events console'],
  [/^\/admin\/announcements$/, 'Compose announcement'],
  [/^\/admin\/shop$/, 'Shop & stock'],
  [/^\/admin\/fundraisers$/, 'Tasks & fundraisers'],
  [/^\/admin\/treasury$/, 'Treasury'],
  [/^\/checkin/, 'Door check-in'],
]

/**
 * Resets scroll on navigation and keeps the tab title in sync with the route.
 * Rendered once inside the router.
 */
export function RouteEffects() {
  const { pathname } = useLocation()

  useEffect(() => {
    // The app controls scroll on navigation; stop the browser restoring a stale offset.
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    const match = TITLES.find(([pattern]) => pattern.test(pathname))
    document.title = match ? `${match[1]} · ${APP_NAME}` : APP_NAME
  }, [pathname])

  return null
}
