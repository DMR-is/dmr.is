import { cookies } from 'next/headers'

// Carries the id_token from a refused sign-in to /api/auth/access-denied
// without putting it in a URL. next-auth v4 redirects before a session
// exists when the `signIn` callback returns a string, so the route has no
// cookie-backed session to read the token from otherwise.
export const LOGOUT_HINT_COOKIE = 'doe.logout_hint'

export const LOGOUT_HINT_COOKIE_PATH = '/api/auth'

const LOGOUT_HINT_MAX_AGE = 60

export const setLogoutHint = async (idToken: string) => {
  const store = await cookies()

  store.set(LOGOUT_HINT_COOKIE, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: LOGOUT_HINT_COOKIE_PATH,
    maxAge: LOGOUT_HINT_MAX_AGE,
  })
}
