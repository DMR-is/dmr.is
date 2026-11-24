import { NextRequest } from 'next/server'

import { endSessionHandler } from '@dmr.is/auth/logoutHandler'

import {
  AUTH_COOKIE_PREFIX,
  identityServerConfig,
} from '../../../../lib/auth/authOptions'

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
    AUTH_COOKIE_PREFIX,
    identityServerConfig,
  )
}

export { handler as POST }
