import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'

import { ApiKeyRequest } from '../api-key/api-key.guard'

/**
 * Rate limits per API key rather than per IP.
 *
 * The default `ThrottlerGuard` tracks by IP, which is the wrong unit here twice
 * over: several vendors can share an egress IP, so one busy integrator would
 * throttle the others, and a single vendor behind several IPs would get a
 * multiple of the intended allowance. The key is the tenant, so the key is the
 * bucket.
 *
 * Falls back to the IP when there is no verified key. That path only sees
 * unauthenticated requests, and letting them share one bucket is what you want
 * when the alternative is an unbounded stream of bad credentials. Requires
 * `ApiKeyGuard` to have run first to get the per-key behaviour.
 */
@Injectable()
export class ApiKeyThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: ApiKeyRequest): Promise<string> {
    const keyId = req.apiKeyContext?.keyId

    if (keyId) {
      return `key:${keyId}`
    }

    const ip = (req as unknown as { ip?: string }).ip

    return `ip:${ip ?? 'unknown'}`
  }
}
