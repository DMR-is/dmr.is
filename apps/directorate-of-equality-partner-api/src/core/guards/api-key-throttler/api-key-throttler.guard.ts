import {
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler'

import { ApiKeyRequest } from '../api-key/api-key.guard'
import { PER_KEY_DRY_RUN_THROTTLER, PER_KEY_THROTTLER } from '../throttlers'

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
export abstract class PerKeyThrottlerGuard extends ThrottlerGuard {
  /** The one bucket this guard enforces. */
  protected abstract readonly bucket: string

  /**
   * See `IpThrottlerGuard.onModuleInit` — the base class enforces every
   * configured throttler, and skip metadata cannot distinguish two guards on
   * one handler, so each guard narrows the list to the bucket it owns.
   *
   * An empty result throws rather than passing: with no throttler to enforce,
   * the base class allows every request. The dry run skips the surface-wide
   * bucket, so a config entry deleted as "unused" or a renamed constant would
   * otherwise leave that route with no per-key limit and nothing failing. A
   * boot failure is the failure mode to want.
   */
  async onModuleInit(): Promise<void> {
    await super.onModuleInit()

    this.throttlers = this.throttlers.filter(
      (throttler) => throttler.name === this.bucket,
    )

    if (this.throttlers.length === 0) {
      throw new Error(
        `${this.constructor.name}: no throttler named "${this.bucket}" is configured in ThrottlerModule.forRoot`,
      )
    }
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

/** The surface-wide per-key allowance. */
@Injectable()
export class ApiKeyThrottlerGuard extends PerKeyThrottlerGuard {
  protected readonly bucket = PER_KEY_THROTTLER
}

/**
 * The dry run's own allowance, applied on that route alone.
 *
 * A separate guard rather than a tighter limit on the shared one, because the
 * point is that the two budgets are separate: see
 * `PER_KEY_DRY_RUN_THROTTLER`. It tracks by the same key and keeps the same
 * surface-wide (rather than per-route) storage key, so moving the dry run to a
 * different path later does not silently reset anyone's allowance.
 */
@Injectable()
export class DryRunThrottlerGuard extends PerKeyThrottlerGuard {
  protected readonly bucket = PER_KEY_DRY_RUN_THROTTLER

  /**
   * `@nestjs/throttler` suffixes `Retry-After` with the bucket name like every
   * other header, so a `429` here would carry only `Retry-After-perKeyDryRun`.
   * `Retry-After` is standard HTTP rather than part of our contract, and
   * generic retry layers (axios-retry, got) read it by name — so it is also
   * sent unsuffixed. Safe to do: this route skips the surface-wide bucket, so no
   * other guard sets it on the same response.
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const { res } = this.getRequestResponse(context)

    res.header('Retry-After', detail.timeToBlockExpire)

    return super.throwThrottlingException(context, detail)
  }
}
