import { isValid as isValidKennitala } from 'kennitala'
import { Op, UniqueConstraintError } from 'sequelize'

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  ApiKeyKindEnum,
  generateApiKey,
  hashApiKeySecret,
} from '@dmr.is/doe-shared'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  apiKeyEnv,
  MAX_LIVE_KEYS_PER_OWNER,
  readApiKeyPepper,
  resolveApiKeyExpiry,
  resolveApiKeyIssuer,
  resolveApiKeyScopes,
} from '../api-key/lib/issuance'
import { PartnerClientDto } from './dto/partner-client.dto'
import {
  IssuedPartnerClientKeyDto,
  PartnerClientKeyDto,
} from './dto/partner-client-key.dto'
import { PartnerClientModel } from './models/partner-client.model'
import { PartnerClientKeyModel } from './models/partner-client-key.model'
import { partnerClientMessages } from './partner-client.messages'
import {
  CreatePartnerClientInput,
  IPartnerClientService,
  IssuePartnerClientKeyInput,
  RevokePartnerClientInput,
  RevokePartnerClientKeyInput,
} from './partner-client.service.interface'

const LOGGING_CONTEXT = 'PartnerClientService'

/**
 * Vendor clients and their credentials.
 *
 * Issuance runs under the same rules as company keys — the scope, expiry,
 * issuer and pepper helpers in `api-key/lib/issuance.ts` — so the two kinds of
 * credential cannot come to differ in what they accept. What differs is the
 * owner (a firm, not a company) and the prefix (`doev_`), which is what routes a
 * presented key to this table.
 *
 * No `company_event` is emitted. A firm is not a company in the register and
 * has no timeline of its own; the actor and timestamp columns on each row are
 * the audit. Delegations, which do belong to a company, are recorded on that
 * company's timeline where they are granted.
 */
@Injectable()
export class PartnerClientService implements IPartnerClientService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(PartnerClientModel)
    private readonly partnerClientModel: typeof PartnerClientModel,
    @InjectModel(PartnerClientKeyModel)
    private readonly partnerClientKeyModel: typeof PartnerClientKeyModel,
  ) {}

  async create(input: CreatePartnerClientInput): Promise<PartnerClientDto> {
    if (!isValidKennitala(input.nationalId)) {
      throw new BadRequestException(partnerClientMessages.invalidKennitala())
    }

    const name = input.name.trim()

    if (!name) {
      throw new BadRequestException(partnerClientMessages.blankName())
    }

    const scopes = resolveApiKeyScopes(input.scopes)

    const existing = await this.partnerClientModel.findOne({
      where: { nationalId: input.nationalId, revokedAt: null },
    })

    if (existing) {
      throw this.duplicateClient()
    }

    let created: PartnerClientModel

    try {
      created = await this.partnerClientModel.create({
        nationalId: input.nationalId,
        name,
        scopes,
        createdByUserId: input.actorUserId,
      })
    } catch (error) {
      // The pre-check above answers the ordinary case; this is the race where
      // two admins approve the same firm at once, and the partial unique index
      // is what decides it.
      if (error instanceof UniqueConstraintError) {
        throw this.duplicateClient()
      }

      throw error
    }

    this.logger.info(`Approved partner client ${created.id}`, {
      context: LOGGING_CONTEXT,
      partnerClientId: created.id,
      actorUserId: input.actorUserId,
    })

    return created.fromModel()
  }

  async list(): Promise<PartnerClientDto[]> {
    const clients = await this.partnerClientModel.findAll({
      order: [['created_at', 'DESC']],
    })

    return clients.map((client) => client.fromModel())
  }

  async get(id: string): Promise<PartnerClientDto> {
    return (await this.findClient(id)).fromModel()
  }

  async revoke(input: RevokePartnerClientInput): Promise<PartnerClientDto> {
    const client = await this.findClient(input.id)

    if (client.revokedAt) {
      // Idempotent: overwriting would replace the real revocation actor and
      // timestamp with a later one.
      return client.fromModel()
    }

    // Conditional on still being live, not just on the read above: two admins
    // revoking at once both read a live row, and an unconditional UPDATE would
    // let the second overwrite who revoked and when.
    const [stamped] = await this.partnerClientModel.update(
      {
        revokedAt: new Date(),
        revokedByUserId: input.actorUserId,
        revokedReason: input.reason ?? null,
      },
      { where: { id: client.id, revokedAt: null } },
    )

    if (stamped === 0) {
      return (await this.findClient(client.id)).fromModel()
    }

    await client.reload()

    this.logger.info(`Revoked partner client ${client.id}`, {
      context: LOGGING_CONTEXT,
      partnerClientId: client.id,
      actorUserId: input.actorUserId,
    })

    return client.fromModel()
  }

  async issueKey(
    input: IssuePartnerClientKeyInput,
  ): Promise<IssuedPartnerClientKeyDto> {
    const client = await this.findClient(input.partnerClientId)

    if (client.revokedAt) {
      // 409 rather than 404: the firm exists and the caller may see it. A
      // credential for it would authenticate nowhere, so minting one would
      // hand out a secret that only looks like success.
      throw new ConflictException(partnerClientMessages.clientRevoked())
    }

    const expiresAt = resolveApiKeyExpiry(input.expiresAt)
    await this.assertLiveKeyBudget(client.id)
    const { actorUserId, actorNationalId } = resolveApiKeyIssuer(input)

    const generated = generateApiKey(apiKeyEnv(), ApiKeyKindEnum.PARTNER_CLIENT)
    const secretHash = hashApiKeySecret(
      generated.secret,
      readApiKeyPepper(this.logger, LOGGING_CONTEXT),
    )

    const created = await this.partnerClientKeyModel.create({
      partnerClientId: client.id,
      keyId: generated.keyId,
      secretHash,
      createdVia: input.createdVia,
      label: input.label ?? null,
      createdByUserId: actorUserId,
      createdByNationalId: actorNationalId,
      expiresAt,
    })

    // keyId only, never the secret.
    this.logger.info(
      `Issued partner client key ${generated.keyId} for client ${client.id}`,
      {
        context: LOGGING_CONTEXT,
        partnerClientId: client.id,
        keyId: generated.keyId,
        createdVia: input.createdVia,
      },
    )

    return {
      key: generated.key,
      id: created.id,
      partnerClientId: client.id,
      keyId: created.keyId,
      label: created.label,
      createdAt: created.createdAt,
      expiresAt: created.expiresAt,
    }
  }

  async listKeys(partnerClientId: string): Promise<PartnerClientKeyDto[]> {
    // Resolved first so an unknown client 404s here as it does on issue and
    // revoke, rather than answering 200 with an empty list.
    await this.findClient(partnerClientId)

    const keys = await this.partnerClientKeyModel.findAll({
      where: { partnerClientId },
      order: [['created_at', 'DESC']],
    })

    return keys.map((key) => key.fromModel())
  }

  async revokeKey(
    input: RevokePartnerClientKeyInput,
  ): Promise<PartnerClientKeyDto> {
    const key = await this.partnerClientKeyModel.findOne({
      where: { id: input.id, partnerClientId: input.partnerClientId },
    })

    // 404 rather than 403 on another firm's key: the caller has no business
    // learning that the id exists.
    if (!key) {
      throw new NotFoundException(partnerClientMessages.keyNotFound())
    }

    if (key.revokedAt) {
      return key.fromModel()
    }

    // Conditional on still being live — see `revoke`.
    const [stamped] = await this.partnerClientKeyModel.update(
      {
        revokedAt: new Date(),
        revokedByUserId: input.actorUserId ?? null,
        revokedByNationalId: input.actorNationalId ?? null,
        revokedReason: input.reason ?? null,
      },
      { where: { id: key.id, revokedAt: null } },
    )

    await key.reload()

    if (stamped === 0) {
      return key.fromModel()
    }

    this.logger.info(
      `Revoked partner client key ${key.keyId} for client ${input.partnerClientId}`,
      {
        context: LOGGING_CONTEXT,
        partnerClientId: input.partnerClientId,
        keyId: key.keyId,
      },
    )

    return key.fromModel()
  }

  private async findClient(id: string): Promise<PartnerClientModel> {
    const client = await this.partnerClientModel.findByPk(id)

    if (!client) {
      throw new NotFoundException(partnerClientMessages.clientNotFound())
    }

    return client
  }

  /** Same ceiling and same rule as company keys: revoked and expired never count. */
  private async assertLiveKeyBudget(partnerClientId: string): Promise<void> {
    const live = await this.partnerClientKeyModel.count({
      where: {
        partnerClientId,
        revokedAt: null,
        [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
      },
    })

    if (live >= MAX_LIVE_KEYS_PER_OWNER) {
      throw new BadRequestException(
        partnerClientMessages.keyCeiling(MAX_LIVE_KEYS_PER_OWNER),
      )
    }
  }

  private duplicateClient(): ConflictException {
    return new ConflictException(partnerClientMessages.duplicateClient())
  }
}
