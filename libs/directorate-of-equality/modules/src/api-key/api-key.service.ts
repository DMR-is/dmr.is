import { Op } from 'sequelize'

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  ApiKeyDto,
  ApiKeyModel,
  generateApiKey,
  hashApiKeySecret,
  IssuedApiKeyDto,
} from '@dmr.is/doe-shared'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ICompanyEventService } from '../company-event/company-event.service.interface'
import {
  apiKeyEnv,
  MAX_LIVE_KEYS_PER_OWNER,
  readApiKeyPepper,
  resolveApiKeyExpiry,
  resolveApiKeyIssuer,
  resolveApiKeyScopes,
} from './lib/issuance'
import {
  IApiKeyService,
  IssueApiKeyInput,
  RevokeApiKeyInput,
} from './api-key.service.interface'

const LOGGING_CONTEXT = 'ApiKeyService'

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
    const scopes = resolveApiKeyScopes(input.scopes)
    const expiresAt = resolveApiKeyExpiry(input.expiresAt)
    await this.assertLiveKeyBudget(input.company.id)
    const { actorUserId, actorNationalId } = resolveApiKeyIssuer(input)

    const generated = generateApiKey(apiKeyEnv())
    const secretHash = hashApiKeySecret(
      generated.secret,
      readApiKeyPepper(this.logger, LOGGING_CONTEXT),
    )

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
        [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
      },
    })

    if (live >= MAX_LIVE_KEYS_PER_OWNER) {
      throw new BadRequestException(
        `A company may hold at most ${MAX_LIVE_KEYS_PER_OWNER} usable API keys — revoke one before issuing another`,
      )
    }
  }
}
