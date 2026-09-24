import { NextRequest } from 'next/server'

import { endSessionHandler } from '@dmr.is/auth/logoutHandler'
import { sessionCookieName } from '@dmr.is/auth/sessionCookies'

import { AUTH_COOKIE_PREFIX } from '../../../../lib/auth/identityServerConfig'

export const dynamic = 'force-dynamic'

const handler = (request: NextRequest) =>
  endSessionHandler(
    request,
    process.env.BASE_URL as string,
    sessionCookieName(AUTH_COOKIE_PREFIX),
  )

export { handler as POST }
