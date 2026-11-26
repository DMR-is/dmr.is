import type { NextRequest, NextResponse } from 'next/server'
import type { CookiesOptions } from 'next-auth'

/**
 * Per-app NextAuth cookie names.
 *
 * Browsers scope cookies by host, not by port. Two apps on `localhost:4200` and
 * `localhost:5200` therefore share one cookie jar, and with NextAuth's default
 * names both keep their session in `next-auth.session-token`: signing in to one
 * overwrites the other's session, which then fails to decrypt (each app has its
 * own `NEXTAUTH_SECRET`) and reads as a logout. The same holds for any two apps
 * ever served from one hostname.
 *
 * An app opts in by passing a short prefix, e.g. `lg-web`, to all three
 * places that name the session cookie — they must agree, or the middleware
 * refreshes a cookie NextAuth never reads:
 *
 * - `authOptions.cookies`       → `appAuthCookies(prefix)`
 * - the middleware              → `createAuthMiddleware({ cookiePrefix })`, or
 *                                 `withAuth({ cookies: { sessionToken: { name } } })`
 * - `getToken` in route handlers → `sessionCookieName(prefix)`
 * - the logout route          → `endSessionHandler(request, uri, prefix)`, which
 *                                 derives the session cookie name itself
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

/** NextAuth's own cookie prefix, used when an app has not opted in. */
export const DEFAULT_COOKIE_PREFIX = 'next-auth'

const securePrefix = (secure: boolean) => (secure ? '__Secure-' : '')

/**
 * The session cookie's name — NextAuth's default when no prefix is given. An
 * empty prefix counts as none, matching `createAuthMiddleware`, which only
 * hands `withAuth` a name for a non-empty one.
 */
export const sessionCookieName = (prefix?: string) =>
  sessionTokenName(prefix || DEFAULT_COOKIE_PREFIX, isSecureSessionCookie())

// The one template for the session cookie's name, shared by `sessionCookieName`
// and `authCookiesFor`.
const sessionTokenName = (prefix: string, secure: boolean) =>
  `${securePrefix(secure)}${prefix}.session-token`

/**
 * The session cookie names to read a token from, first match wins. An app with
 * its own prefix has one. An app on NextAuth's defaults has both variants,
 * because NextAuth picks `__Secure-` from the `NEXTAUTH_URL` scheme, which can
 * disagree with the `NODE_ENV` rule `sessionCookieName` follows.
 */
export const sessionCookieNames = (prefix?: string) =>
  prefix
    ? [sessionCookieName(prefix)]
    : [
        sessionTokenName(DEFAULT_COOKIE_PREFIX, true),
        sessionTokenName(DEFAULT_COOKIE_PREFIX, false),
      ]

/**
 * Every cookie NextAuth sets, renamed under `prefix`, with NextAuth's own
 * default options. Not only the session token: two sign-ins in flight at once
 * would otherwise still trample each other's state, PKCE verifier and
 * callback URL.
 */
export const appAuthCookies = (prefix: string): Partial<CookiesOptions> =>
  authCookiesFor(prefix, isSecureSessionCookie())

const authCookiesFor = (
  prefix: string,
  secure: boolean,
): Partial<CookiesOptions> => {
  const pre = securePrefix(secure)
  const base = { httpOnly: true, sameSite: 'lax' as const, path: '/', secure }

  return {
    sessionToken: {
      name: sessionTokenName(prefix, secure),
      options: base,
    },
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
 * Whether a cookie belongs to this app's NextAuth set: its name is `prefix`
 * followed by a dot, with or without a `__Secure-` / `__Host-` prefix. Covers
 * the session chunks (`<session cookie>.0`, ...) as well. Used by
 * `expireAppAuthCookies`, and by routes that clear the session by hand, so they
 * clear their own cookies and leave another app's alone.
 */
export const isAppAuthCookie = (cookieName: string, prefix: string) =>
  ['', '__Secure-', '__Host-'].some((pre) =>
    cookieName.startsWith(`${pre}${prefix}.`),
  )

/**
 * Options that expire one of this app's NextAuth cookies.
 *
 * ⚠️ Not `response.cookies.delete(name)`: that sends no `Secure` attribute, and
 * browsers apply the `__Secure-` / `__Host-` prefix rules to a deletion too, so
 * in production — where every name is prefixed — the header is dropped and the
 * cookie survives. `path: '/'` is required by `__Host-` and is where NextAuth
 * sets them all.
 */
export const expiredAuthCookieOptions = (
  secure: boolean = isSecureSessionCookie(),
) => ({
  path: '/',
  maxAge: 0,
  expires: new Date(0),
  httpOnly: true,
  sameSite: 'lax' as const,
  secure,
})

/**
 * Expires every NextAuth cookie of one app on `response`: the full set under
 * the app's names, plus whatever of the app's cookies the request carries
 * (session chunks `<session cookie>.0`, `.1`, …). Another app's cookies are
 * left alone.
 *
 * An app on NextAuth's default names gets both the `__Secure-` and the plain
 * variants expired: NextAuth picks the variant from the `NEXTAUTH_URL` scheme,
 * not from `NODE_ENV`, so which one is in the browser is not known here.
 * Expiring a cookie that is absent is harmless.
 *
 * @param prefix the app's cookie prefix; omitted for NextAuth's default names.
 */
export const expireAppAuthCookies = (
  request: NextRequest,
  response: NextResponse,
  prefix?: string,
) => {
  const effective = prefix || DEFAULT_COOKIE_PREFIX
  const variants = prefix
    ? [isSecureSessionCookie()]
    : [isSecureSessionCookie(), !isSecureSessionCookie()]

  const expire = (name: string) =>
    response.cookies.set(
      name,
      '',
      expiredAuthCookieOptions(
        name.startsWith('__Secure-') || name.startsWith('__Host-'),
      ),
    )

  for (const secure of variants) {
    for (const cookie of Object.values(authCookiesFor(effective, secure))) {
      if (cookie?.name) expire(cookie.name)
    }
  }

  for (const cookie of request.cookies.getAll()) {
    if (isAppAuthCookie(cookie.name, effective)) expire(cookie.name)
  }
}
