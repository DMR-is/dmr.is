import { NextRequest } from 'next/server'

import { endSessionHandler } from '@dmr.is/auth/logoutHandler'

export const dynamic = 'force-dynamic'

const handler = (request: NextRequest) => {
  const postLogoutRedirectUri = (
    process.env.NODE_ENV !== 'production'
      ? process.env.LG_APPLICATION_WEB_URL
      : process.env.IDENTITY_SERVER_LOGOUT_URL
  ) as string

  return endSessionHandler(request, postLogoutRedirectUri)
}

export { handler as POST }
