import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const NEXT_AUTH_COOKIE_PREFIXES = [
  'next-auth.',
  '__Secure-next-auth.',
  '__Host-next-auth.',
]

function handler(request: NextRequest) {
  const url = new URL(request.url)
  const idToken = url.searchParams.get('id_token')

  const postLogoutRedirectUri =
    process.env.NODE_ENV !== 'production'
      ? (process.env.DOE_WEB_URL as string)
      : (process.env.IDENTITY_SERVER_LOGOUT_URL as string)

  const endSessionUrl = `https://${process.env.IDENTITY_SERVER_DOMAIN}/connect/endsession?id_token_hint=${idToken}&post_logout_redirect_uri=${encodeURIComponent(
    postLogoutRedirectUri,
  )}`

  const response = NextResponse.redirect(endSessionUrl)

  for (const cookie of request.cookies.getAll()) {
    if (NEXT_AUTH_COOKIE_PREFIXES.some((p) => cookie.name.startsWith(p))) {
      response.cookies.delete(cookie.name)
    }
  }

  return response
}

export { handler as GET, handler as POST }
