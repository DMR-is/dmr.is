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
 * Environment segment baked into every issued key (`doe_<env>_...`). Set per
 * deployment so a staging credential pasted into production is rejected on
 * shape rather than after a hash miss, which is a far clearer error to hand an
 * integrator. Defaults to `dev` because that is the safe end to be wrong on.
 */
const API_KEY_ENV_VAR = 'DOE_API_KEY_ENV'
const DEFAULT_API_KEY_ENV = 'dev'

/** Server-side HMAC key. Absent means the API cannot issue or verify at all. */
const API_KEY_PEPPER_VAR = 'DOE_API_KEY_PEPPER'

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
    const { actorUserId, actorNationalId } = this.resolveIssuer(input)

    const generated = generateApiKey(this.env())
    const secretHash = hashApiKeySecret(generated.secret, this.pepper())

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
      expiresAt: input.expiresAt ?? null,
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
      throw new BadRequestException(`Unknown API key scopes: ${unknown.join(', ')}`)
    }

    return [...new Set(scopes)]
  }

  private env(): string {
    return process.env[API_KEY_ENV_VAR] || DEFAULT_API_KEY_ENV
  }

  private pepper(): string {
    const pepper = process.env[API_KEY_PEPPER_VAR]

    if (!pepper) {
      this.logger.error(
        `Missing required environment variable: ${API_KEY_PEPPER_VAR}`,
        { context: LOGGING_CONTEXT },
      )
      throw new InternalServerErrorException(
        `Missing required environment variable: ${API_KEY_PEPPER_VAR}`,
      )
    }

    return pepper
  }
}
