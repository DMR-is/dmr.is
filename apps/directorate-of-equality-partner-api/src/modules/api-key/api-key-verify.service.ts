import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  ApiKeyModel,
  parseApiKey,
  verifyApiKeySecret,
} from '@dmr.is/doe-shared'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ApiKeyContext } from './api-key.types'
import { IApiKeyVerifyService } from './api-key-verify.service.interface'

const LOGGING_CONTEXT = 'ApiKeyVerifyService'

/** Server-side HMAC key. Absent means this service cannot verify anything. */
const HMAC_SECRET_VAR = 'DOE_API_KEY_HMAC_SECRET'

/**
 * How stale `last_used_at` is allowed to be. Authenticating is a read; writing
 * on every request would turn the hot path into a write and buy nothing —
 * nobody needs last-used to the second.
 */
const LAST_USED_TOUCH_INTERVAL_MS = 60_000

@Injectable()
export class ApiKeyVerifyService implements IApiKeyVerifyService {
  /** keyId → when `last_used_at` was last written, for the touch interval. */
  private readonly lastTouched = new Map<string, number>()

  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ApiKeyModel)
    private readonly apiKeyModel: typeof ApiKeyModel,
  ) {}

  async verify(presented: string): Promise<ApiKeyContext> {
    const parsed = parseApiKey(presented)

    if (!parsed) {
      // No log line naming the input: a malformed credential is still a
      // credential, and the whole point is not to write it down.
      throw this.reject('malformed')
    }

    const key = await this.apiKeyModel.findOne({
      where: { keyId: parsed.keyId },
    })

    if (!key) {
      throw this.reject('unknown keyId', parsed.keyId)
    }

    if (!verifyApiKeySecret(parsed.secret, key.secretHash, this.hmacSecret())) {
      throw this.reject('secret mismatch', parsed.keyId)
    }

    // The two checks `verifyApiKeySecret` cannot make, because it takes a hash
    // rather than a row. Its docblock says so explicitly: a guard that stopped
    // at the hash would compile, pass every test, and make the revoke button in
    // the admin UI cosmetic.
    if (key.revokedAt) {
      throw this.reject('revoked', parsed.keyId)
    }

    if (key.expiresAt && key.expiresAt.getTime() <= Date.now()) {
      throw this.reject('expired', parsed.keyId)
    }

    await this.touchLastUsed(key)

    return {
      id: key.id,
      keyId: key.keyId,
      companyId: key.companyId,
      companyNationalId: key.companyNationalId,
      scopes: key.scopes,
    }
  }

  /**
   * One exception for every failure, with the reason logged rather than
   * returned. Distinguishable errors would let a caller probe which keyIds
   * exist, and "revoked" versus "unknown" is not information a rejected caller
   * is owed.
   */
  private reject(reason: string, keyId?: string): UnauthorizedException {
    this.logger.warn(`API key rejected: ${reason}`, {
      context: LOGGING_CONTEXT,
      reason,
      keyId,
    })

    return new UnauthorizedException('Invalid API key')
  }

  private async touchLastUsed(key: ApiKeyModel): Promise<void> {
    const now = Date.now()
    const previous = this.lastTouched.get(key.keyId) ?? 0

    if (now - previous < LAST_USED_TOUCH_INTERVAL_MS) {
      return
    }

    this.lastTouched.set(key.keyId, now)

    // Best effort. A failed bookkeeping write must not fail an otherwise
    // authenticated request — last-used is an activity indicator, not a
    // security control.
    try {
      await key.update({ lastUsedAt: new Date(now) })
    } catch (error) {
      this.logger.error('Failed to update API key last_used_at', {
        context: LOGGING_CONTEXT,
        keyId: key.keyId,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  private hmacSecret(): string {
    const secret = process.env[HMAC_SECRET_VAR]

    if (!secret) {
      this.logger.error(
        `Missing required environment variable: ${HMAC_SECRET_VAR}`,
        { context: LOGGING_CONTEXT },
      )
      // Not an UnauthorizedException: the caller's credential may be perfectly
      // good and this service cannot tell. Saying 401 would send an integrator
      // chasing their own key over our misconfiguration.
      throw new Error(`Missing required environment variable: ${HMAC_SECRET_VAR}`)
    }

    return secret
  }
}
