import { JWT } from 'next-auth/jwt'
import { getLogger } from '@dmr.is/logging-next'

import { REFRESH_TIMEOUT_MS, refreshAccessToken } from './token-service'

const LOGGING_CATEGORY = 'refreshAccessToken'

/**
 * How long a settled refresh stays reusable.
 *
 * This covers stragglers: requests that were already on their way (or that read
 * the session cookie before the refreshed one reached the browser) still present
 * the *previous* refresh token. IDS has already burned that token, so letting
 * them call `/connect/token` again earns an `invalid_grant` and kills a session
 * that is in fact perfectly healthy. Handing them the result of the refresh that
 * already happened is both correct and free.
 *
 * It needs to comfortably outlast the 60s NextAuth session poll, which rewrites
 * the cookie from whatever token it read and is the main source of stragglers.
 */
const RESULT_TTL_MS = 90 * 1000

/**
 * A hung flight can never outlive this, so an entry older than one timeout plus
 * slack is treated as dead rather than awaited forever.
 */
const FLIGHT_TTL_MS = REFRESH_TIMEOUT_MS * 2

/** Bounds memory: one entry per session refreshing at any given moment. */
const MAX_ENTRIES = 500

type RefreshResult = Awaited<ReturnType<typeof refreshAccessToken>>

type Flight = {
  promise: Promise<RefreshResult>
  startedAt: number
  /** Null while in flight. */
  settledAt: number | null
}

const flights = new Map<string, Flight>()

const isReusable = (flight: Flight, now: number): boolean =>
  flight.settledAt === null
    ? now - flight.startedAt < FLIGHT_TTL_MS
    : now - flight.settledAt < RESULT_TTL_MS

const evictExpired = (now: number): void => {
  for (const [key, flight] of flights) {
    if (!isReusable(flight, now)) {
      flights.delete(key)
    }
  }

  // Insertion order, so the oldest go first. Only reached if a single instance
  // is refreshing hundreds of sessions inside one TTL window.
  while (flights.size > MAX_ENTRIES) {
    const oldest = flights.keys().next()
    if (oldest.done) {
      break
    }
    flights.delete(oldest.value)
  }
}

/**
 * Refreshes the token, collapsing concurrent attempts that share a refresh token
 * into a single call to IDS.
 *
 * IDS issues one-time-use refresh tokens: the first `/connect/token` call rotates
 * the token and every later call with the old one fails. A single page load fires
 * a document request, RSC requests, prefetches and a tRPC batch — and a second
 * browser tab doubles that — all hitting the middleware with the same expired
 * token at the same moment. Without this, one of them wins and the rest get
 * `invalid_grant`, so whichever response sets its cookie last decides whether the
 * session survives. That is the "worked fine, then suddenly everything failed"
 * report.
 *
 * Deduplication is per instance and best-effort. Requests spread across replicas
 * can still race; nothing short of a shared store fixes that, and the middleware
 * runs in the edge sandbox where we have no such store. In practice a burst comes
 * from one browser and lands on one instance.
 */
export const refreshAccessTokenOnce = (
  token: JWT,
  redirectUri?: string,
  clientId?: string,
  clientSecret?: string,
): Promise<RefreshResult> => {
  const key = token.refreshToken as string | undefined

  if (!key) {
    // Nothing to collapse on, and refreshAccessToken reports it properly.
    return refreshAccessToken(token, redirectUri, clientId, clientSecret)
  }

  const now = Date.now()
  const existing = flights.get(key)

  if (existing && isReusable(existing, now)) {
    getLogger(LOGGING_CATEGORY).info('Reusing in-progress or recent refresh', {
      metadata: { inFlight: existing.settledAt === null },
      category: LOGGING_CATEGORY,
    })

    return existing.promise
  }

  const flight: Flight = {
    startedAt: now,
    settledAt: null,
    promise: refreshAccessToken(token, redirectUri, clientId, clientSecret),
  }

  flight.promise = flight.promise.then(
    (result) => {
      flight.settledAt = Date.now()
      return result
    },
    (error) => {
      // Transient by the time it reaches here (token-service only throws for
      // failures that left the refresh token intact), so drop the entry and let
      // the next request genuinely retry instead of replaying the failure.
      flights.delete(key)
      throw error
    },
  )

  flights.set(key, flight)
  evictExpired(now)

  return flight.promise
}

/** Test seam: module-level state would otherwise leak between test cases. */
export const resetRefreshSingleFlight = (): void => {
  flights.clear()
}
