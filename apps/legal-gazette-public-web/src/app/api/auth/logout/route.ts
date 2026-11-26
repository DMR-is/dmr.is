import { NextRequest } from 'next/server'

import { endSessionHandler } from '@dmr.is/auth/logoutHandler'

import { identityServerConfig } from '../../../../lib/authOptions'

export const dynamic = 'force-dynamic'

const handler = (request: NextRequest) =>
  endSessionHandler(
    request,
    process.env.BASE_URL as string,
    undefined,
    identityServerConfig,
  )

export { handler as POST }
