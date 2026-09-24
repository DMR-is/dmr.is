import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  PartnerClientKeyModel,
  PartnerClientModel,
} from '@dmr.is/doe-modules/partner-client'
import {
  ApiKeyKindEnum,
  ApiKeyModel,
  parseApiKey,
  verifyApiKeySecret,
} from '@dmr.is/doe-shared'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  ApiKeyContext,
  CompanyKeyContext,
  PartnerClientKeyContext,
} from './api-key.types'
import { IApiKeyVerifyService } from './api-key-verify.service.interface'

const LOGGING_CONTEXT = 'ApiKeyVerifyService'

/** What both key tables have in common, and all verification needs. */
type UsableKey = {
  keyId: string
  secretHash: string
  revokedAt: Date | null
  expiresAt: Date | null
  update(values: { lastUsedAt: Date }): Promise<unknown>
}

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
  /** kind:keyId → when `last_used_at` was last written, for the touch interval. */
  private readonly lastTouched = new Map<string, number>()

  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ApiKeyModel)
    private readonly apiKeyModel: typeof ApiKeyModel,
    @InjectModel(PartnerClientKeyModel)
    private readonly partnerClientKeyModel: typeof PartnerClientKeyModel,
    @InjectModel(PartnerClientModel)
    private readonly partnerClientModel: typeof PartnerClientModel,
  ) {}

  async verify(presented: string): Promise<ApiKeyContext> {
    const parsed = parseApiKey(presented)

    if (!parsed) {
      // No log line naming the input: a malformed credential is still a
      // credential, and the whole point is not to write it down.
      throw this.reject('malformed')
    }

    // The prefix names the table, so this is one indexed read either way
    // rather than trying one table and then the other.
    return parsed.kind === ApiKeyKindEnum.PARTNER_CLIENT
      ? this.verifyPartnerClientKey(parsed.keyId, parsed.secret)
      : this.verifyCompanyKey(parsed.keyId, parsed.secret)
  }

  private async verifyCompanyKey(
    keyId: string,
    secret: string,
  ): Promise<CompanyKeyContext> {
    const key = await this.apiKeyModel.findOne({ where: { keyId } })

    this.assertUsable(key, keyId, secret)
    await this.touchLastUsed(ApiKeyKindEnum.COMPANY, key)

    return {
      kind: ApiKeyKindEnum.COMPANY,
      id: key.id,
      keyId: key.keyId,
      companyId: key.companyId,
      companyNationalId: key.companyNationalId,
      scopes: key.scopes,
    }
  }

  /**
   * A firm's key, checked exactly as a company key is, and then the firm
   * itself: revoking the client cuts off every key it holds without touching
   * them, so a live key under a revoked client must still be refused. That is
   * the second read, and the same `401` as every other failure.
   */
  private async verifyPartnerClientKey(
    keyId: string,
    secret: string,
  ): Promise<PartnerClientKeyContext> {
    const key = await this.partnerClientKeyModel.findOne({ where: { keyId } })

    this.assertUsable(key, keyId, secret)

    const client = await this.partnerClientModel.findByPk(key.partnerClientId)

    if (!client || client.revokedAt) {
      throw this.reject('partner client revoked', keyId)
    }

    await this.touchLastUsed(ApiKeyKindEnum.PARTNER_CLIENT, key)

    return {
      kind: ApiKeyKindEnum.PARTNER_CLIENT,
      id: key.id,
      keyId: key.keyId,
      partnerClientId: client.id,
      scopes: client.scopes,
      // The firm's ceiling, not yet what this request may do.
      scopesResolved: false,
    }
  }

  /**
   * The checks every credential passes, whichever table it lives in.
   *
   * `revokedAt` and `expiresAt` are the two `verifyApiKeySecret` cannot make,
   * because it takes a hash rather than a row. Its docblock says so explicitly:
   * a guard that stopped at the hash would compile, pass every test, and make
   * the revoke button in the admin UI cosmetic.
   */
  private assertUsable<T extends UsableKey>(
    key: T | null,
    keyId: string,
    secret: string,
  ): asserts key is T {
    if (!key) {
      throw this.reject('unknown keyId', keyId)
    }

    if (!verifyApiKeySecret(secret, key.secretHash, this.hmacSecret())) {
      throw this.reject('secret mismatch', keyId)
    }

    if (key.revokedAt) {
      throw this.reject('revoked', keyId)
    }

    if (key.expiresAt && key.expiresAt.getTime() <= Date.now()) {
      throw this.reject('expired', keyId)
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

  private async touchLastUsed(
    kind: ApiKeyKindEnum,
    key: UsableKey,
  ): Promise<void> {
    const now = Date.now()
    // Keyed by kind as well: keyIds are unique per table, not across them.
    const touchKey = `${kind}:${key.keyId}`
    const previous = this.lastTouched.get(touchKey) ?? 0

    if (now - previous < LAST_USED_TOUCH_INTERVAL_MS) {
      return
    }

    this.lastTouched.set(touchKey, now)

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
      throw new Error(
        `Missing required environment variable: ${HMAC_SECRET_VAR}`,
      )
    }

    return secret
  }
}
