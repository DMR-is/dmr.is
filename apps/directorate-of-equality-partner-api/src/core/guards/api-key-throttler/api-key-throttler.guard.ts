import {
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'

import { ApiKeyRequest } from '../api-key/api-key.guard'
import { PER_KEY_THROTTLER } from '../throttlers'

/**
 * Rate limits per API key rather than per IP.
 *
 * The default `ThrottlerGuard` tracks by IP, which is the wrong unit here twice
 * over: several vendors can share an egress IP, so one busy integrator would
 * throttle the others, and a single vendor behind several IPs would get a
 * multiple of the intended allowance. The key is the tenant, so the key is the
 * bucket.
 *
 * Requires `ApiKeyGuard` to have run first, and only ever sees authenticated
 * requests as a consequence. It is therefore NOT what bounds a stream of bad
 * credentials — `ApiKeyGuard` throws before this guard is reached, so nothing
 * here is incremented on the 401 path. `IpThrottlerGuard` covers that, globally.
 */
@Injectable()
export class ApiKeyThrottlerGuard extends ThrottlerGuard {
  /**
   * See `IpThrottlerGuard.onModuleInit` — the base class enforces every
   * configured throttler, and skip metadata cannot distinguish two guards on
   * one handler, so each guard narrows the list to the bucket it owns.
   */
  async onModuleInit(): Promise<void> {
    await super.onModuleInit()

    this.throttlers = this.throttlers.filter(
      (throttler) => throttler.name === PER_KEY_THROTTLER,
    )
  }

  protected async getTracker(req: ApiKeyRequest): Promise<string> {
    const keyId = req.apiKeyContext?.keyId

    if (keyId) {
      return `key:${keyId}`
    }

    // Unreachable while ApiKeyGuard precedes this guard, and deliberately not
    // an IP fallback: falling back would silently bucket a whole tenant under
    // one IP the moment the guard order changed, which reads as a working limit
    // while measuring the wrong thing.
    //
    // Thrown without a message on purpose. HttpExceptionFilter genericises
    // `message` but copies the exception's own message into `details`, which IS
    // returned to the caller — so naming the guards here would put our wiring
    // in a client response. Same reasoning as RequireApiScopeGuard.
    throw new InternalServerErrorException()
  }

  /**
   * The allowance is per key across the whole surface, not per key per route.
   * The base class hashes the controller and handler name into the storage key,
   * which would silently multiply the documented limit by the number of
   * operations — thirteen of them here.
   */
  protected generateKey(
    _context: ExecutionContext,
    suffix: string,
    name: string,
  ): string {
    return `${name}-${suffix}`
  }
}
