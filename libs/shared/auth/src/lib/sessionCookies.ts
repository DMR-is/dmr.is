import type { CookiesOptions } from 'next-auth'

/**
 * Per-app NextAuth cookie names.
 *
 * Browsers scope cookies by host, not by port. Two apps on `localhost:5200` and
 * `localhost:5201` therefore share one cookie jar, and with NextAuth's default
 * names both keep their session in `next-auth.session-token`: signing in to one
 * overwrites the other's session, which then fails to decrypt (each app has its
 * own `NEXTAUTH_SECRET`) and reads as a logout. The same holds for any two apps
 * ever served from one hostname.
 *
 * An app opts in by passing a short prefix, e.g. `doe-partner`, to all three
 * places that name the session cookie — they must agree, or the middleware
 * refreshes a cookie NextAuth never reads:
 *
 * - `authOptions.cookies`       → `appAuthCookies(prefix)`
 * - the middleware              → `createAuthMiddleware({ cookiePrefix })`, or
 *                                 `withAuth({ cookies: { sessionToken: { name } } })`
 * - `getToken` in route handlers → `sessionCookieName(prefix)`
 *
 * An app that passes nothing keeps NextAuth's default names, so this is
 * behaviour-neutral for everyone who has not opted in.
 *
 * Renaming does not touch encryption: next-auth v4 derives the JWE key with an
 * empty salt, not from the cookie name. It does orphan the old cookie, so every
 * signed-in user of an app that opts in signs in once more.
 */

/**
 * Whether session cookies are `Secure` and `__Secure-`-prefixed. The same rule
 * the refresh middleware has always used to name the cookie it rewrites, so
 * NextAuth, `getToken` and the middleware cannot disagree about it.
 */
export const isSecureSessionCookie = () =>
  process.env.NODE_ENV === 'production' &&
  process.env.NEXTAUTH_COOKIE_SECURE !== 'false'

const securePrefix = (secure: boolean) => (secure ? '__Secure-' : '')

/** The session cookie's name — NextAuth's default when no prefix is given. */
export const sessionCookieName = (prefix?: string) =>
  `${securePrefix(isSecureSessionCookie())}${prefix ?? 'next-auth'}.session-token`

/**
 * Every cookie NextAuth sets, renamed under `prefix`, with NextAuth's own
 * default options. Not only the session token: two sign-ins in flight at once
 * would otherwise still trample each other's state, PKCE verifier and
 * callback URL.
 */
export const appAuthCookies = (prefix: string): Partial<CookiesOptions> => {
  const secure = isSecureSessionCookie()
  const pre = securePrefix(secure)
  const base = { httpOnly: true, sameSite: 'lax' as const, path: '/', secure }

  return {
    sessionToken: { name: sessionCookieName(prefix), options: base },
    callbackUrl: { name: `${pre}${prefix}.callback-url`, options: base },
    csrfToken: {
      // `__Host-` rather than `__Secure-`, as NextAuth's default does: the CSRF
      // cookie must not be settable from a subdomain.
      name: `${secure ? '__Host-' : ''}${prefix}.csrf-token`,
      options: base,
    },
    pkceCodeVerifier: {
      name: `${pre}${prefix}.pkce.code_verifier`,
      options: { ...base, maxAge: 60 * 15 },
    },
    state: {
      name: `${pre}${prefix}.state`,
      options: { ...base, maxAge: 60 * 15 },
    },
    nonce: { name: `${pre}${prefix}.nonce`, options: base },
  }
}

/**
 * Whether a cookie belongs to this app's NextAuth set — for routes that clear
 * the session by hand, so they clear their own and leave another app's alone.
 */
export const isAppAuthCookie = (cookieName: string, prefix: string) =>
  ['', '__Secure-', '__Host-'].some((pre) =>
    cookieName.startsWith(`${pre}${prefix}.`),
  )
