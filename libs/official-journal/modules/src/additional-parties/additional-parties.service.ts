import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { Application } from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

import { AdvertInvolvedPartyModel } from '../journal/models/advert-involved-party.model'
import { AdditionalPartiesModel } from './models'

const LOGGING_CATEGORY = 'additional-parties-service'

@Injectable()
export class AdditionalPartiesService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdditionalPartiesModel)
    private readonly additionalPartiesModel: typeof AdditionalPartiesModel,
    @InjectModel(AdvertInvolvedPartyModel)
    private readonly involvedPartyModel: typeof AdvertInvolvedPartyModel,
    private readonly sequelize: Sequelize,
  ) {}

  async syncCaseAdditionalParties(
    caseId: string,
    application: Application,
    transaction?: Transaction,
    advertId?: string | null,
  ): Promise<void> {
    const involvedParties = await this.getAdditionalInvolvedParties(
      application.assignees,
      application.answers.advert.involvedPartyId,
      transaction,
    )

    const existingParties = await this.additionalPartiesModel.findAll({
      transaction,
      where: {
        caseId,
      },
    })
    const linkedAdvertId =
      advertId ??
      existingParties.find((party) => party.advertId !== null)?.advertId ??
      null

    await this.additionalPartiesModel.destroy({
      force: true,
      transaction,
      where: {
        caseId,
      },
    })

    if (involvedParties.length === 0) {
      return
    }

    await this.additionalPartiesModel.bulkCreate(
      involvedParties.map((party) => ({
        caseId,
        advertId: linkedAdvertId,
        involvedPartyId: party.id,
      })),
      { transaction },
    )
  }

  async linkCasePartiesToAdvert(
    caseId: string,
    advertId: string,
    transaction?: Transaction,
  ): Promise<void> {
    await this.additionalPartiesModel.update(
      { advertId },
      {
        transaction,
        where: {
          caseId,
        },
      },
    )
  }

  @LogAndHandle()
  @Transactional()
  async addCaseAdditionalParty(
    caseId: string,
    involvedPartyId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const existing = await this.additionalPartiesModel.findOne({
      where: { caseId, involvedPartyId },
      transaction,
    })

    if (existing) {
      return ResultWrapper.err({
        code: 400,
        message: 'Additional party already exists on this case',
      })
    }

    const involvedParty = await this.involvedPartyModel.findByPk(
      involvedPartyId,
      { transaction },
    )

    if (!involvedParty) {
      throw new BadRequestException('Involved party not found')
    }

    await this.additionalPartiesModel.create(
      { caseId, involvedPartyId },
      { transaction },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async deleteCaseAdditionalParty(
    caseId: string,
    involvedPartyId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const deleted = await this.additionalPartiesModel.destroy({
      where: { caseId, involvedPartyId },
      force: true,
      transaction,
    })

    if (deleted === 0) {
      return ResultWrapper.err({
        code: 404,
        message: 'Additional party not found on this case',
      })
    }

    return ResultWrapper.ok()
  }

  private async getAdditionalInvolvedParties(
    assignees: string[] | undefined,
    primaryInvolvedPartyId: string,
    transaction?: Transaction,
  ): Promise<AdvertInvolvedPartyModel[]> {
    const normalizedAssignees = this.normalizeNationalIds(assignees ?? [])

    if (normalizedAssignees.length === 0) {
      return []
    }

    const primaryInvolvedParty = await this.involvedPartyModel.findByPk(
      primaryInvolvedPartyId,
      {
        attributes: ['id', 'nationalId'],
        transaction,
      },
    )
    const primaryNationalId = primaryInvolvedParty
      ? this.normalizeNationalId(primaryInvolvedParty.nationalId)
      : null
    const additionalNationalIds = primaryNationalId
      ? normalizedAssignees.filter(
          (nationalId) => nationalId !== primaryNationalId,
        )
      : normalizedAssignees

    if (additionalNationalIds.length === 0) {
      return []
    }

    const additionalNationalIdsSet = new Set(additionalNationalIds)

    const lookupValues = [
      ...new Set(
        additionalNationalIds.flatMap((id) => this.getLookupValues(id)),
      ),
    ]

    const involvedParties = await this.involvedPartyModel.findAll({
      transaction,
      order: [['isPrimary', 'DESC NULLS LAST']],
      where: {
        nationalId: {
          [Op.in]: lookupValues,
        },
      },
    })

    const involvedPartiesByNationalId = new Map<
      string,
      AdvertInvolvedPartyModel
    >()

    involvedParties.forEach((party) => {
      const nationalId = this.normalizeNationalId(party.nationalId)

      if (
        party.id === primaryInvolvedPartyId ||
        nationalId === primaryNationalId ||
        !additionalNationalIdsSet.has(nationalId)
      ) {
        return
      }

      const selectedParty = involvedPartiesByNationalId.get(nationalId)

      if (!selectedParty || (party.isPrimary && !selectedParty.isPrimary)) {
        involvedPartiesByNationalId.set(nationalId, party)
      }
    })

    const missingNationalIds = additionalNationalIds.filter(
      (nationalId) => !involvedPartiesByNationalId.has(nationalId),
    )

    if (missingNationalIds.length > 0) {
      this.logger.warn('Application assignees did not match involved parties', {
        category: LOGGING_CATEGORY,
        missingNationalIds,
      })
    }

    return additionalNationalIds.flatMap((nationalId) => {
      const party = involvedPartiesByNationalId.get(nationalId)

      return party ? [party] : []
    })
  }

  private normalizeNationalIds(nationalIds: string[]): string[] {
    const normalized = nationalIds
      .map((nationalId) => this.normalizeNationalId(nationalId))
      .filter((nationalId) => nationalId.length > 0)

    return [...new Set(normalized)]
  }

  private normalizeNationalId(nationalId: string): string {
    return nationalId.replace(/\D/g, '')
  }

  private getLookupValues(nationalId: string): string[] {
    if (nationalId.length !== 10) {
      return [nationalId]
    }

    return [nationalId, `${nationalId.slice(0, 6)}-${nationalId.slice(6)}`]
  }
}
