import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CompanyModel } from '../company/models/company.model'
import { PartnerDelegationDto } from './dto/partner-delegation.dto'
import { PartnerDelegationModel } from './models/partner-delegation.model'
import { IPartnerDelegationService } from './partner-delegation.service.interface'

@Injectable()
export class PartnerDelegationService implements IPartnerDelegationService {
  constructor(
    @InjectModel(PartnerDelegationModel)
    private readonly partnerDelegationModel: typeof PartnerDelegationModel,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
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
}
