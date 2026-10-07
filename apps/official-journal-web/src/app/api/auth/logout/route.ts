import { NextRequest } from 'next/server'

import { endSessionHandler } from '@dmr.is/auth/logoutHandler'
import { sessionCookieName } from '@dmr.is/auth/sessionCookies'

import { AUTH_COOKIE_PREFIX } from '../../../../lib/auth/authOptions'

export const dynamic = 'force-dynamic'

const handler = (request: NextRequest) => {
  const postLogoutRedirectUri = (
    process.env.NODE_ENV !== 'production'
      ? process.env.OFFICIAL_JOURNAL_WEB_URL
      : process.env.IDENTITY_SERVER_LOGOUT_URL
  ) as string

  return endSessionHandler(
    request,
    postLogoutRedirectUri,
    sessionCookieName(AUTH_COOKIE_PREFIX),
  )
}

export { handler as POST }
