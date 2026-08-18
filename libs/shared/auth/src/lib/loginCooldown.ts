/**
 * Bounds how often a 401 may bounce the user through IDS.
 *
 * Not every 401 means the session is gone — an API can answer 401 for an
 * *authorization* failure while IDS keeps happily issuing valid sessions. Forcing
 * a login then succeeds, lands back on the same page, fails the same way, and
 * loops. One forced login per window; after that the error belongs on screen.
 *
 * The marker has to be a cookie: `forceLogin` clears `sessionStorage` on its way
 * out, and the redirect discards module state.
 *
 * These are pure so they can be tested without a DOM; the caller owns
 * `document.cookie`.
 */
const COOKIE_NAME = 'dmr.forced_login'

export const LOGIN_COOLDOWN_SECONDS = 60

/**
 * @param cookieHeader the raw `document.cookie` value
 */
export const hasLoginCooldown = (cookieHeader: string): boolean =>
  cookieHeader
    .split(';')
    .some((cookie) => cookie.trim().startsWith(`${COOKIE_NAME}=`))

/** The value to assign to `document.cookie` to start the cooldown. */
export const loginCooldownCookie = (): string =>
  `${COOKIE_NAME}=1; Max-Age=${LOGIN_COOLDOWN_SECONDS}; Path=/; SameSite=Lax`
