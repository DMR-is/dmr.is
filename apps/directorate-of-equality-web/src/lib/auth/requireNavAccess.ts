import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { type NavPath } from '../constants'
import { authOptions } from './authOptions'

/**
 * Resolves the session for a page and enforces the `adminOnly` flag its
 * `NAV_PATHS` entry carries, so the flag is the single source of truth for both
 * halves of "admin-only route": hiding it from the nav and refusing to render
 * it. Written as a helper rather than a per-page `role !== 'ADMIN'` literal
 * because a future `adminOnly: true` entry would otherwise read like protection
 * while granting none.
 *
 * `notFound()` rather than a 403: a reviewer without the role should not learn
 * the page exists.
 */
export const requireNavAccess = async (navPath: NavPath) => {
  const session = await getServerSession(authOptions)

  if (navPath.adminOnly && session?.user?.role !== 'ADMIN') {
    notFound()
  }

  return session
}
