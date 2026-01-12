import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { assertAdvertsEditable } from '../../core/utils/advert-status.util'
import { AdvertModel } from '../../models/advert.model'
import {
  SettlementModel,
  UpdateSettlementDto,
} from '../../models/settlement.model'

@Injectable()
export class SettlementService {
  constructor(
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

    await settlement.update({
      liquidatorName: body.liquidatorName,
      liquidatorLocation: body.liquidatorLocation,
      name: body.name,
      nationalId: body.nationalId,
      address: body.address,
      deadline: body.deadline ? new Date(body.deadline) : null,
      dateOfDeath: body.dateOfDeath ? new Date(body.dateOfDeath) : null,
      declaredClaims: body.declaredClaims,
    })
  }
}
