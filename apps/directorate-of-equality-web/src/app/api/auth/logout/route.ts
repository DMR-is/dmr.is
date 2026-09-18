import { NextRequest } from 'next/server'

import { endSessionHandler } from '@dmr.is/auth/logoutHandler'

export const dynamic = 'force-dynamic'

const handler = (request: NextRequest) =>
  endSessionHandler(request, process.env.BASE_URL as string)

export { handler as POST }
