import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// The id_token is read from the HttpOnly NextAuth cookie rather than a query
// parameter so it never appears in one of our own URLs (access logs, browser
// history). Only the returned IDS end-session URL carries it.
export const endSessionHandler = async (
  request: NextRequest,
  postLogoutRedirectUri: string,
) => {
  const token = await getToken({ req: request })

  if (!token) {
    return Response.json({ message: 'No token found' }, { status: 401 })
  }

  const params = new URLSearchParams({
    post_logout_redirect_uri: postLogoutRedirectUri,
  })

  if (token.idToken) {
    params.set('id_token_hint', token.idToken as string)
  }

  return Response.json({
    url: `https://${process.env.IDENTITY_SERVER_DOMAIN}/connect/endsession?${params.toString()}`,
  })
}
