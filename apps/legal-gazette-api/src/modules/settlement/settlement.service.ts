import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { Logger } from '@dmr.is/logging-next'

import { assertAdvertsEditable } from '../../core/utils/advert-status.util'
import { AdvertModel } from '../../models/advert.model'
import {
  SettlementModel,
  UpdateSettlementDto,
} from '../../models/settlement.model'

const LOGGING_CONTEXT = 'SettlementService'
@Injectable()
export class SettlementService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(SettlementModel)
    private readonly settlementModel: typeof SettlementModel,
  ) {}

  async updateSettlement(id: string, body: UpdateSettlementDto): Promise<void> {
    const settlement = await this.settlementModel.findByPkOrThrow(id, {
      include: [
        {
          model: AdvertModel,
          attributes: ['id', 'statusId'],
        },
      ],
    })

    // Prevent modification if any associated advert is in a terminal state
    assertAdvertsEditable(settlement.adverts || [], 'settlement')

    // Build update object with only the fields that are present in the body
    const updateData: Partial<SettlementModel> = {}

    if (body.liquidatorName !== undefined) {
      updateData.liquidatorName = body.liquidatorName
    }
    if (body.liquidatorLocation !== undefined) {
      updateData.liquidatorLocation = body.liquidatorLocation
    }
    if (body.name !== undefined) {
      updateData.name = body.name
    }
    if (body.nationalId !== undefined) {
      updateData.nationalId = body.nationalId
    }
    if (body.address !== undefined) {
      updateData.address = body.address
    }
    if (body.deadline !== undefined) {
      updateData.deadline = body.deadline ? new Date(body.deadline) : null
    }
    if (body.dateOfDeath !== undefined) {
      updateData.dateOfDeath = body.dateOfDeath
        ? new Date(body.dateOfDeath)
        : null
    }
    if (body.declaredClaims !== undefined) {
      updateData.declaredClaims = body.declaredClaims
    }
    if (body.liquidatorRecallStatementLocation !== undefined) {
      updateData.liquidatorRecallStatementLocation =
        body.liquidatorRecallStatementLocation
    }
    if (body.liquidatorRecallStatementType !== undefined) {
      updateData.liquidatorRecallStatementType =
        body.liquidatorRecallStatementType
    }
    if (body.type !== undefined) {
      updateData.type = body.type
    }

    await settlement.update(updateData)

    this.logger.info('Settlement updated successfully', {
      settlementId: id,
      context: LOGGING_CONTEXT,
    })
  }
}
