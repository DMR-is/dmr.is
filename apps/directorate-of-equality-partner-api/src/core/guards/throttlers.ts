/**
 * The two rate-limit buckets this surface runs, and why there are two.
 *
 * They answer different questions and, critically, they run at different points
 * in the request. `PER_KEY_THROTTLER` needs to know *which tenant* is calling,
 * so it can only run after `ApiKeyGuard` has verified a credential — which means
 * it never sees a request that failed authentication. `PER_IP_THROTTLER` runs as
 * a global guard, before every other guard, so it is the only one that can count
 * a rejected credential at all.
 *
 * A single throttler cannot do both jobs: whichever position it takes, it is
 * blind to the other half of the traffic.
 *
 * Names matter beyond identification. `@nestjs/throttler` suffixes its response
 * headers with the throttler name for every name except `default`, so the
 * per-key bucket keeps that name to leave `X-RateLimit-Limit` and friends
 * unsuffixed on the published contract.
 */
export const PER_KEY_THROTTLER = 'default'
export const PER_IP_THROTTLER = 'perIp'
