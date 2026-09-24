import { UniqueConstraintError } from 'sequelize'

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyModel } from '../company/models/company.model'
import { ICompanyEventService } from '../company-event/company-event.service.interface'
import { CompanyPartnerDelegationDto } from './dto/company-partner-delegation.dto'
import { PartnerDelegationDto } from './dto/partner-delegation.dto'
import { PartnerClientModel } from './models/partner-client.model'
import { PartnerDelegationModel } from './models/partner-delegation.model'
import { partnerClientMessages } from './partner-client.messages'
import {
  GrantPartnerDelegationInput,
  IPartnerDelegationService,
  RevokePartnerDelegationInput,
} from './partner-delegation.service.interface'

const LOGGING_CONTEXT = 'PartnerDelegationService'

/** How the firm is named on the company's timeline. */
const firmLabel = (client: PartnerClientModel): string =>
  `${client.name} (${client.nationalId})`

@Injectable()
export class PartnerDelegationService implements IPartnerDelegationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(PartnerDelegationModel)
    private readonly partnerDelegationModel: typeof PartnerDelegationModel,
    @InjectModel(PartnerClientModel)
    private readonly partnerClientModel: typeof PartnerClientModel,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
    @Inject(ICompanyEventService)
    private readonly companyEventService: ICompanyEventService,
  ) {}

  findLive(
    partnerClientId: string,
    companyNationalId: string,
  ): Promise<PartnerDelegationModel | null> {
    // Served by doe_partner_delegation_active_uq, whose WHERE clause this
    // mirrors — so a revoked row can never answer, and at most one live one can.
    return this.partnerDelegationModel.findOne({
      where: { partnerClientId, companyNationalId, revokedAt: null },
    })
  }

  async listLiveForClient(
    partnerClientId: string,
  ): Promise<PartnerDelegationDto[]> {
    const delegations = await this.partnerDelegationModel.findAll({
      where: { partnerClientId, revokedAt: null },
      order: [['created_at', 'DESC']],
    })

    if (delegations.length === 0) {
      return []
    }

    // Names in one query rather than an association: the delegation model
    // declares none, and a firm's book is a list, not a graph to walk.
    const companies = await this.companyModel.findAll({
      where: { id: delegations.map((delegation) => delegation.companyId) },
      attributes: ['id', 'name'],
    })
    const nameById = new Map(
      companies.map((company) => [company.id, company.name]),
    )

    return delegations.map((delegation) => ({
      id: delegation.id,
      companyNationalId: delegation.companyNationalId,
      companyName: nameById.get(delegation.companyId) ?? '',
      scopes: delegation.scopes,
      grantedAt: delegation.createdAt,
    }))
  }

  async listLiveForCompany(
    companyId: string,
  ): Promise<CompanyPartnerDelegationDto[]> {
    const delegations = await this.partnerDelegationModel.findAll({
      where: { companyId, revokedAt: null },
      order: [['created_at', 'DESC']],
    })

    if (delegations.length === 0) {
      return []
    }

    // Live firms only. Revoking a firm leaves its delegations in place, and the
    // partner API already refuses it — listing it would tell a company that a
    // provider which can no longer file is still allowed to.
    const clients = await this.partnerClientModel.findAll({
      where: {
        id: delegations.map((delegation) => delegation.partnerClientId),
        revokedAt: null,
      },
    })
    const clientById = new Map(clients.map((client) => [client.id, client]))

    return delegations.flatMap((delegation) => {
      const client = clientById.get(delegation.partnerClientId)
      // Absent means the firm was revoked (see above); its FK guarantees the
      // row otherwise.
      return client ? [this.toCompanyDto(delegation, client)] : []
    })
  }

  async grant(
    input: GrantPartnerDelegationInput,
  ): Promise<CompanyPartnerDelegationDto> {
    const client = await this.partnerClientModel.findByPk(input.partnerClientId)

    // A revoked firm is not offered, so it answers as though it does not exist:
    // only active providers are listed, and only listed ones can be chosen.
    if (!client || client.revokedAt) {
      throw new NotFoundException(partnerClientMessages.providerNotFound())
    }

    const scopes = [...new Set(input.scopes)]
    const beyondApproval = scopes.filter(
      (scope) => !client.scopes.includes(scope),
    )

    // Stored scopes beyond the firm's approval would be dead — the partner API
    // intersects them away — but a company reading its own grant back would
    // believe it had allowed something that can never happen.
    if (scopes.length === 0 || beyondApproval.length > 0) {
      throw new BadRequestException(
        beyondApproval.length > 0
          ? partnerClientMessages.beyondApproval(beyondApproval)
          : partnerClientMessages.emptyGrant(),
      )
    }

    const existing = await this.findLive(client.id, input.company.nationalId)

    if (existing) {
      throw this.alreadyGranted()
    }

    let created: PartnerDelegationModel

    try {
      created = await this.partnerDelegationModel.create({
        partnerClientId: client.id,
        companyId: input.company.id,
        companyNationalId: input.company.nationalId,
        scopes,
        grantedByNationalId: input.actorNationalId,
      })
    } catch (error) {
      // Two tabs granting at once: the partial unique index decides, and the
      // loser gets the same answer as the pre-check.
      if (error instanceof UniqueConstraintError) {
        throw this.alreadyGranted()
      }

      throw error
    }

    this.logger.info(
      `Company ${input.company.id} delegated to partner client ${client.id}`,
      {
        context: LOGGING_CONTEXT,
        companyId: input.company.id,
        partnerClientId: client.id,
        scopes,
      },
    )

    await this.companyEventService.emitPartnerDelegationGranted(
      input.company.id,
      input.company.status,
      firmLabel(client),
    )

    return this.toCompanyDto(created, client)
  }

  async revoke(
    input: RevokePartnerDelegationInput,
  ): Promise<CompanyPartnerDelegationDto> {
    const delegation = await this.partnerDelegationModel.findOne({
      where: { id: input.id, companyId: input.company.id },
    })

    // 404 rather than 403 for another company's delegation: the caller has no
    // business learning that the id exists.
    if (!delegation) {
      throw new NotFoundException(partnerClientMessages.delegationNotFound())
    }

    const client = await this.partnerClientModel.findByPk(
      delegation.partnerClientId,
    )

    if (!client) {
      throw new NotFoundException(partnerClientMessages.delegationNotFound())
    }

    if (delegation.revokedAt) {
      // Idempotent: overwriting would replace who withdrew it, and when.
      return this.toCompanyDto(delegation, client)
    }

    // Conditional on still being live, and the event emitted only by the
    // request that actually withdrew it. A double-clicked Withdraw sends two
    // requests that both read a live row; unconditional, the second would
    // re-stamp who withdrew it and write a second timeline event.
    const [stamped] = await this.partnerDelegationModel.update(
      {
        revokedAt: new Date(),
        revokedByNationalId: input.actorNationalId ?? null,
        revokedByUserId: input.actorUserId ?? null,
      },
      { where: { id: delegation.id, revokedAt: null } },
    )

    await delegation.reload()

    if (stamped === 0) {
      return this.toCompanyDto(delegation, client)
    }

    this.logger.info(
      `Company ${input.company.id} withdrew its delegation to partner client ${client.id}`,
      {
        context: LOGGING_CONTEXT,
        companyId: input.company.id,
        partnerClientId: client.id,
      },
    )

    await this.companyEventService.emitPartnerDelegationRevoked(
      input.company.id,
      input.company.status,
      firmLabel(client),
      input.actorUserId,
    )

    return this.toCompanyDto(delegation, client)
  }

  private toCompanyDto(
    delegation: PartnerDelegationModel,
    client: PartnerClientModel,
  ): CompanyPartnerDelegationDto {
    return {
      id: delegation.id,
      provider: {
        id: client.id,
        name: client.name,
        nationalId: client.nationalId,
      },
      scopes: delegation.scopes,
      grantedAt: delegation.createdAt,
      grantedByNationalId: delegation.grantedByNationalId,
    }
  }

  private alreadyGranted(): ConflictException {
    return new ConflictException(partnerClientMessages.alreadyGranted())
  }
}
