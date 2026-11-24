import type { NextApiRequest } from 'next'
import { cookies, headers } from 'next/headers'
import { getToken } from 'next-auth/jwt'

import { sessionCookieName } from '@dmr.is/auth/sessionCookies'

import { AUTH_COOKIE_PREFIX } from './identityServerConfig'

const SESSION_COOKIE = sessionCookieName(AUTH_COOKIE_PREFIX)

// The island.is id/access tokens live only in the encrypted, HttpOnly NextAuth
// JWT cookie. They are deliberately absent from the session object, which is
// serialised to the browser. Server code reads them here instead.
export const getServerToken = async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])

  return getToken({
    req: {
      cookies: Object.fromEntries(
        cookieStore.getAll().map(({ name, value }) => [name, value]),
      ),
      headers: Object.fromEntries(headerStore.entries()),
    } as unknown as NextApiRequest,
    cookieName: SESSION_COOKIE,
  })
}

// Returns the bearer token for the DoE API, or null when there is no usable
// session.
export const getServerIdToken = async (): Promise<string | null> => {
  const token = await getServerToken()

  if (!token || token.invalid || !token.idToken) {
    return null
  }

  return token.idToken
}
