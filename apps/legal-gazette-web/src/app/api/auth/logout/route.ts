import { NextRequest } from 'next/server'

import { endSessionHandler } from '@dmr.is/auth/logoutHandler'

import { AUTH_COOKIE_PREFIX } from '../../../../lib/auth/authOptions'

export const dynamic = 'force-dynamic'

const handler = (request: NextRequest) =>
  endSessionHandler(request, process.env.BASE_URL as string, AUTH_COOKIE_PREFIX)

export { handler as POST }
