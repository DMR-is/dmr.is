import { decodeJwt } from 'jose'
import { JWT } from 'next-auth/jwt'
import { getLogger } from '@dmr.is/logging-next'

import { REFRESH_TIMEOUT_MS, refreshAccessToken } from './token-service'

const LOGGING_CATEGORY = 'refreshAccessToken'

/**
 * Ceiling on how long a settled refresh stays reusable.
 *
 * This covers stragglers: requests that were already on their way (or that read
 * the session cookie before the refreshed one reached the browser) still present
 * the *previous* refresh token. If the client rotates on use, IDS has already
 * burned that token, so letting them call `/connect/token` again earns an
 * `invalid_grant` and kills a session that is in fact perfectly healthy. Handing
 * them the result of the refresh that already happened is both correct and free.
 *
 * It wants to outlast the 60s NextAuth session poll, which rewrites the cookie
 * from whatever token it read and is the main source of stragglers — but never
 * to outlast the refresh interval itself. See {@link reuseWindowFor}.
 */
const MAX_RESULT_TTL_MS = 90 * 1000

/**
 * A hung flight can never outlive this, so an entry older than one timeout plus
 * slack is treated as dead rather than awaited forever.
 */
const FLIGHT_TTL_MS = REFRESH_TIMEOUT_MS * 2

/**
 * How long a rejected flight is replayed before another call to IDS is allowed,
 * doubling per consecutive failure.
 *
 * Without this, an IDS outage turns every incoming request into its own
 * `/connect/token` attempt — and since a 429 is transient, being rate-limited
 * would make us generate *more* traffic.
 */
const FAILURE_BACKOFF_BASE_MS = 2 * 1000
const FAILURE_BACKOFF_MAX_MS = 30 * 1000

/**
 * When a refresh keeps failing for a reason that is not `invalid_grant`, the
 * session is left intact so it can recover. That is right for a blip and wrong
 * forever: `isExpired` keeps returning true, so the user would sit on a silently
 * 401-ing UI while we retry against IDS indefinitely, never prompted to
 * re-authenticate. Past this many consecutive failures spanning at least this
 * long, we give up and end the session so the user gets sent back to IDS.
 */
const MAX_CONSECUTIVE_FAILURES = 5
const MIN_FAILURE_SPAN_MS = 2 * 60 * 1000

/** Bounds memory: one entry per session refreshing at any given moment. */
const MAX_ENTRIES = 500

type RefreshResult = Awaited<ReturnType<typeof refreshAccessToken>>

type Flight = {
  promise: Promise<RefreshResult>
  startedAt: number
  /** Null while in flight. */
  settledAt: number | null
  /** How long the settled value stays reusable; only meaningful once settled. */
  reuseForMs: number
}

type FailureRun = {
  count: number
  firstAt: number
  lastAt: number
}

const flights = new Map<string, Flight>()

/**
 * Consecutive failures per refresh token. A failed refresh does not rotate the
 * token, so the key stays stable across an outage and the run accumulates.
 */
const failures = new Map<string, FailureRun>()

/**
 * Reuse window for a successful refresh: capped so it can never span the moment
 * the *next* refresh is due, which is what would let us hand back a refresh
 * token that has since been rotated away.
 *
 * At a 5-minute access-token lifetime the cap never binds. It exists so that
 * shortening the lifetime cannot silently turn the straggler cache into a source
 * of stale tokens.
 */
const reuseWindowFor = (result: RefreshResult, now: number): number => {
  if (result.invalid) {
    // A terminal result stays true for as long as the token is presented.
    return MAX_RESULT_TTL_MS
  }

  try {
    const exp = decodeJwt(result.accessToken as string).exp
    if (typeof exp !== 'number') {
      return MAX_RESULT_TTL_MS
    }

    // Half the remaining life, so the window closes well before the middleware
    // starts refreshing again.
    const untilNextRefresh = exp * 1000 - now
    return Math.max(
      0,
      Math.min(MAX_RESULT_TTL_MS, Math.floor(untilNextRefresh / 2)),
    )
  } catch {
    return MAX_RESULT_TTL_MS
  }
}

const isReusable = (flight: Flight, now: number): boolean =>
  flight.settledAt === null
    ? now - flight.startedAt < FLIGHT_TTL_MS
    : now - flight.settledAt < flight.reuseForMs

const evictExpired = (now: number): void => {
  for (const [key, flight] of flights) {
    if (!isReusable(flight, now)) {
      flights.delete(key)
    }
  }

  for (const [key, run] of failures) {
    if (
      now - run.lastAt >
      Math.max(MIN_FAILURE_SPAN_MS, FAILURE_BACKOFF_MAX_MS)
    ) {
      failures.delete(key)
    }
  }

  // Insertion order, so the oldest go first. In-flight entries are skipped: a
  // request is waiting on each of them, and evicting one would let a duplicate
  // call to IDS start behind its back.
  if (flights.size > MAX_ENTRIES) {
    for (const [key, flight] of flights) {
      if (flights.size <= MAX_ENTRIES) {
        break
      }
      if (flight.settledAt !== null) {
        flights.delete(key)
      }
    }
  }

  // Failure runs are keyed on refresh tokens too, so they get the same explicit
  // ceiling rather than being bounded only by how many distinct tokens happen to
  // be failing inside one prune window. Dropping the oldest costs at most a
  // restarted backoff ladder.
  while (failures.size > MAX_ENTRIES) {
    const oldest = failures.keys().next()
    if (oldest.done) {
      break
    }
    failures.delete(oldest.value)
  }
}

/**
 * Records a failed attempt and reports whether we should stop retrying.
 *
 * Requires both a count and an elapsed span so a short burst of concurrent
 * failures cannot end a session that a single retry would have recovered.
 */
const recordFailure = (key: string, now: number): FailureRun => {
  const previous = failures.get(key)
  const run: FailureRun = previous
    ? { count: previous.count + 1, firstAt: previous.firstAt, lastAt: now }
    : { count: 1, firstAt: now, lastAt: now }

  failures.set(key, run)
  return run
}

const shouldGiveUp = (run: FailureRun): boolean =>
  run.count >= MAX_CONSECUTIVE_FAILURES &&
  run.lastAt - run.firstAt >= MIN_FAILURE_SPAN_MS

const backoffFor = (run: FailureRun): number =>
  Math.min(
    FAILURE_BACKOFF_MAX_MS,
    FAILURE_BACKOFF_BASE_MS * 2 ** (run.count - 1),
  )

/**
 * Refreshes the token, collapsing concurrent attempts that share a refresh token
 * into a single call to IDS.
 *
 * Where a client issues one-time-use refresh tokens, the first `/connect/token`
 * call rotates the token and every later call with the old one fails. A single
 * page load fires a document request, RSC requests, prefetches and a tRPC batch —
 * and a second browser tab doubles that — all hitting the middleware with the
 * same expired token at the same moment. Without this, one of them wins and the
 * rest get `invalid_grant`, so whichever response sets its cookie last decides
 * whether the session survives.
 *
 * Note this dedupes *within* a burst. Each success rotates the token, so the next
 * burst arrives under a different key and refreshes again — it does not throttle
 * successive refreshes, and is not a substitute for fixing an abnormal cadence.
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
  // NOTE: the raw refresh token is the map key, held for the reuse window. It
  // must never reach a log line — keep it out of `metadata`.
  const key = token.refreshToken as string | undefined

  if (!key) {
    // Nothing to collapse on, and refreshAccessToken reports it properly.
    return refreshAccessToken(token, redirectUri, clientId, clientSecret)
  }

  const now = Date.now()
  const existing = flights.get(key)

  if (existing && isReusable(existing, now)) {
    getLogger(LOGGING_CATEGORY).debug('Reusing in-progress or recent refresh', {
      metadata: { inFlight: existing.settledAt === null },
      category: LOGGING_CATEGORY,
    })

    return existing.promise
  }

  const flight: Flight = {
    startedAt: now,
    settledAt: null,
    reuseForMs: MAX_RESULT_TTL_MS,
    promise: refreshAccessToken(token, redirectUri, clientId, clientSecret),
  }

  flight.promise = flight.promise.then(
    (result) => {
      const settledAt = Date.now()
      flight.settledAt = settledAt
      flight.reuseForMs = reuseWindowFor(result, settledAt)

      if (!result.invalid) {
        failures.delete(key)
      }

      return result
    },
    (error) => {
      const failedAt = Date.now()
      const run = recordFailure(key, failedAt)

      if (shouldGiveUp(run)) {
        // Retrying is no longer plausibly useful. End the session so the user is
        // sent back to IDS rather than left on a UI that 401s in silence.
        getLogger(LOGGING_CATEGORY).error(
          'Refreshing kept failing, ending session',
          {
            error: 'RefreshRetriesExhausted',
            metadata: {
              attempts: run.count,
              spanMs: run.lastAt - run.firstAt,
            },
            category: LOGGING_CATEGORY,
          },
        )

        failures.delete(key)
        flight.settledAt = failedAt
        flight.reuseForMs = MAX_RESULT_TTL_MS

        return {
          ...token,
          error: 'RefreshRetriesExhausted',
          invalid: true,
        } as RefreshResult
      }

      // Replay the rejection for a short, escalating window so an outage does not
      // turn every request into its own call to IDS, then let the next request
      // genuinely retry.
      flight.settledAt = failedAt
      flight.reuseForMs = backoffFor(run)

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
  failures.clear()
}
