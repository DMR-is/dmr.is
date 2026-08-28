import { Op } from 'sequelize'

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  ApiKeyDto,
  ApiKeyModel,
  ApiKeyOriginEnum,
  ApiKeyScopeEnum,
  DEFAULT_API_KEY_SCOPES,
  generateApiKey,
  hashApiKeySecret,
  IssuedApiKeyDto,
} from '@dmr.is/doe-shared'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ICompanyEventService } from '../company-event/company-event.service.interface'
import {
  IApiKeyService,
  IssueApiKeyInput,
  RevokeApiKeyInput,
} from './api-key.service.interface'

const LOGGING_CONTEXT = 'ApiKeyService'

/**
 * Environment segment baked into every issued key (`doe_<env>_...`), so a dev
 * credential pasted into production is rejected on shape rather than after a
 * hash miss — a far clearer error to hand an integrator.
 *
 * ⚠️ The segment is a DIAGNOSTIC, not a control. Nothing compares it on the
 * verifying side and it sits outside the HMAC, so a caller can edit it freely
 * and the key still verifies. It exists so a human reading a key, a log line or
 * a support ticket can tell which environment minted it — not to stop a staging
 * key working in production. An earlier version of this docblock claimed it made
 * such a key "fail on shape"; that was never true.
 *
 * Reuses `API_ENV` rather than declaring a variable of its own, and falls back
 * to `dev`. Since no DoE app schema declares `API_ENV`, varlock will not warn
 * when it is absent — which is tolerable precisely because the value is
 * advisory. If it ever becomes load-bearing it needs declaring first.
 */
const API_KEY_ENV_VAR = 'API_ENV'
const DEFAULT_API_KEY_ENV = 'dev'

/**
 * Ceiling on usable keys per company. Generous enough that rotation and a
 * second integrator are never blocked, low enough that a runaway loop stops.
 */
const MAX_LIVE_KEYS_PER_COMPANY = 10

/** Server-side HMAC key. Absent means the API cannot issue or verify at all. */
const API_KEY_HMAC_SECRET_VAR = 'DOE_API_KEY_HMAC_SECRET'

@Injectable()
export class ApiKeyService implements IApiKeyService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ApiKeyModel)
    private readonly apiKeyModel: typeof ApiKeyModel,
    @Inject(ICompanyEventService)
    private readonly companyEventService: ICompanyEventService,
  ) {}

  async issue(input: IssueApiKeyInput): Promise<IssuedApiKeyDto> {
    const scopes = this.resolveScopes(input.scopes)
    const expiresAt = this.resolveExpiry(input.expiresAt)
    await this.assertLiveKeyBudget(input.company.id)
    const { actorUserId, actorNationalId } = this.resolveIssuer(input)

    const generated = generateApiKey(this.env())
    const secretHash = hashApiKeySecret(generated.secret, this.hmacSecret())

    const created = await this.apiKeyModel.create({
      companyId: input.company.id,
      companyNationalId: input.company.nationalId,
      keyId: generated.keyId,
      secretHash,
      scopes,
      createdVia: input.createdVia,
      label: input.label ?? null,
      createdByUserId: actorUserId,
      createdByNationalId: actorNationalId,
      expiresAt,
    })

    // Deliberately logs keyId and never the secret: keyId is the public half,
    // and it is what ties this line to the company_event row and to the key the
    // integrator holds.
    this.logger.info(
      `Issued API key ${generated.keyId} for company ${input.company.id}`,
      {
        context: LOGGING_CONTEXT,
        companyId: input.company.id,
        keyId: generated.keyId,
        createdVia: input.createdVia,
      },
    )

    await this.companyEventService.emitApiKeyIssued(
      input.company.id,
      input.company.status,
      generated.keyId,
      actorUserId,
    )

    return {
      key: generated.key,
      id: created.id,
      keyId: created.keyId,
      label: created.label,
      scopes: created.scopes,
      createdAt: created.createdAt,
      expiresAt: created.expiresAt,
    }
  }

  async list(companyId: string): Promise<ApiKeyDto[]> {
    const keys = await this.apiKeyModel.findAll({
      where: { companyId },
      order: [['created_at', 'DESC']],
    })

    return keys.map((key) => key.fromModel())
  }

  async revoke(input: RevokeApiKeyInput): Promise<ApiKeyDto> {
    const key = await this.apiKeyModel.findOne({
      where: { id: input.id, companyId: input.company.id },
    })

    // 404 rather than 403 on a key belonging to another company: the caller has
    // no business learning that the id exists.
    if (!key) {
      throw new NotFoundException('API key not found')
    }

    if (key.revokedAt) {
      // Idempotent. Overwriting would replace a real revocation actor and
      // timestamp with a later one, which is exactly the audit trail this
      // table exists to keep.
      this.logger.info(
        `API key ${key.keyId} is already revoked; leaving the original revocation intact`,
        {
          context: LOGGING_CONTEXT,
          companyId: input.company.id,
          keyId: key.keyId,
        },
      )

      return key.fromModel()
    }

    await key.update({
      revokedAt: new Date(),
      revokedByUserId: input.actorUserId ?? null,
      revokedByNationalId: input.actorNationalId ?? null,
      revokedReason: input.reason ?? null,
    })

    this.logger.info(
      `Revoked API key ${key.keyId} for company ${input.company.id}`,
      {
        context: LOGGING_CONTEXT,
        companyId: input.company.id,
        keyId: key.keyId,
      },
    )

    await this.companyEventService.emitApiKeyRevoked(
      input.company.id,
      input.company.status,
      key.keyId,
      input.actorUserId,
      input.reason,
    )

    return key.fromModel()
  }

  /**
   * Rejects an expiry that is already past.
   *
   * Without this the caller gets 201 and a plaintext secret that no verifier will
   * ever accept — the worst possible answer, because it looks like success and
   * the failure only appears when the integrator tries to use it. Null stays
   * meaningful: no expiry is a documented choice, offered as "ótímabundinn" in
   * the admin UI.
   */
  private resolveExpiry(expiresAt?: Date | null): Date | null {
    if (!expiresAt) {
      return null
    }

    if (expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'expiresAt must be in the future — a key that has already expired cannot be used',
      )
    }

    return expiresAt
  }

  /**
   * Caps how many usable keys one company may hold at once.
   *
   * Rotation needs two keys, not two thousand. Nothing counted before, so a
   * caller could mint unbounded live bearer credentials for its own tenant in a
   * loop — bounded in blast radius to that one company, but still credential
   * sprawl and row growth with no ceiling. Revoked and expired rows are excluded
   * so the audit history never blocks issuing.
   */
  private async assertLiveKeyBudget(companyId: string): Promise<void> {
    const live = await this.apiKeyModel.count({
      where: {
        companyId,
        revokedAt: null,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } },
        ],
      },
    })

    if (live >= MAX_LIVE_KEYS_PER_COMPANY) {
      throw new BadRequestException(
        `A company may hold at most ${MAX_LIVE_KEYS_PER_COMPANY} usable API keys — revoke one before issuing another`,
      )
    }
  }

  /**
   * Which actor column to populate, derived from the issuance path rather than
   * taken on trust. `doe_api_key_created_actor_chk` enforces the same pairing in
   * the database; failing here first turns what would be a 500 from a constraint
   * violation into a clear 400.
   */
  private resolveIssuer(input: IssueApiKeyInput): {
    actorUserId: string | null
    actorNationalId: string | null
  } {
    if (input.createdVia === ApiKeyOriginEnum.ADMIN) {
      if (!input.actorUserId) {
        throw new BadRequestException(
          'An admin-issued API key must record the issuing reviewer',
        )
      }

      return { actorUserId: input.actorUserId, actorNationalId: null }
    }

    if (!input.actorNationalId) {
      throw new BadRequestException(
        'A self-service API key must record the issuing national ID',
      )
    }

    return { actorUserId: null, actorNationalId: input.actorNationalId }
  }

  /**
   * `scopes` is a text[] rather than an enum array, so the database will accept
   * any string. Validate here so an unrecognised scope cannot be stored and then
   * silently fail every scope check at request time.
   */
  private resolveScopes(scopes?: ApiKeyScopeEnum[]): ApiKeyScopeEnum[] {
    if (!scopes || scopes.length === 0) {
      return [...DEFAULT_API_KEY_SCOPES]
    }

    const known = new Set<string>(Object.values(ApiKeyScopeEnum))
    const unknown = scopes.filter((scope) => !known.has(scope))

    if (unknown.length > 0) {
      throw new BadRequestException(
        `Unknown API key scopes: ${unknown.join(', ')}`,
      )
    }

    return [...new Set(scopes)]
  }

  private env(): string {
    return process.env[API_KEY_ENV_VAR] || DEFAULT_API_KEY_ENV
  }

  /**
   * The server-side secret mixed into every key digest.
   *
   * `api-key.crypto.ts` calls this a pepper, which is the precise term for a
   * server-wide secret added to a hash — as opposed to a salt, which is
   * per-record and stored beside the digest. The distinction matters here
   * because it is why rotating this value invalidates every issued key. The
   * name follows the environment variable rather than the crypto term so that
   * what is configured and what is read are searchably the same string.
   */
  private hmacSecret(): string {
    const secret = process.env[API_KEY_HMAC_SECRET_VAR]

    if (!secret) {
      this.logger.error(
        `Missing required environment variable: ${API_KEY_HMAC_SECRET_VAR}`,
        { context: LOGGING_CONTEXT },
      )
      // Logged, not returned. HttpExceptionFilter genericises `message` but
      // copies the exception's own message into `details`, which IS sent — so
      // naming the variable here publishes a piece of our deployment
      // configuration to whoever provoked the 500.
      throw new InternalServerErrorException()
    }

    return secret
  }
}
