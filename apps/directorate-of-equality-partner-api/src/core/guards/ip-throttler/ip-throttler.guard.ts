import { ExecutionContext, Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'

import { PER_IP_THROTTLER } from '../throttlers'

/**
 * Bounds request volume per client IP, before anything has been authenticated.
 *
 * This exists because every other guard on this surface runs too late to see a
 * failed authentication. `ApiKeyGuard` throws on a bad credential, so any guard
 * declared after it in `@UseGuards` — the per-key throttler included — is never
 * reached on the 401 path. Registered as an `APP_GUARD`, this one runs before
 * all of them, which is the whole point: it is the only thing that counts a
 * request that turns out to be unauthenticated.
 *
 * What it is and is not for. The credential is a 43-character base64 secret, so
 * guessing one is not the threat — the threat is cost. Without a bound, an
 * unauthenticated stream buys an indexed `key_id` lookup and, when the id
 * happens to exist, an HMAC, per request, forever. The limit is therefore set
 * where no real integrator can reach it but a flood is still capped. Volumetric
 * defence proper belongs at the load balancer; note that the WAF on the public
 * ALB currently has no rate-limit rule configured.
 *
 * Two things to know before trusting a number it reports:
 *
 * - **It depends on `trust proxy`.** `req.ip` is the socket peer unless Express
 *   is told how many proxies sit in front, and behind an ALB that peer is the
 *   ALB — which would collapse every caller into one bucket and let one flood
 *   throttle everybody. `main.ts` sets the hop count; if a CDN is ever put in
 *   front of this service, that number has to change with it.
 * - **The store is per-process.** `ThrottlerModule` defaults to in-memory
 *   storage, so the effective ceiling is the limit times the replica count, and
 *   it resets on deploy. A shared store is the fix if this ever needs to be an
 *   exact bound rather than a backstop.
 */
@Injectable()
export class IpThrottlerGuard extends ThrottlerGuard {
  /**
   * `ThrottlerGuard.canActivate` enforces every throttler in the module config,
   * and both guards on this surface read their skip metadata from the same
   * handler — so `@SkipThrottle` cannot tell them apart. Narrowing the list the
   * guard iterates is what keeps the two buckets from crossing: this one owns
   * the per-IP bucket and must not also apply the per-key allowance to an IP.
   */
  async onModuleInit(): Promise<void> {
    await super.onModuleInit()

    this.throttlers = this.throttlers.filter(
      (throttler) => throttler.name === PER_IP_THROTTLER,
    )
  }

  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const ip = typeof req.ip === 'string' ? req.ip : undefined

    return `ip:${ip ?? 'unknown'}`
  }

  /**
   * One bucket for the whole surface rather than the base class's per-route
   * default, which hashes the controller and handler name into the key. Per
   * route, an attacker simply spreads the same flood across the routes and
   * multiplies its allowance by their number.
   */
  protected generateKey(
    _context: ExecutionContext,
    suffix: string,
    name: string,
  ): string {
    return `${name}-${suffix}`
  }
}
