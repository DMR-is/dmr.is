import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { UpdateSettlementDto } from './dto/settlement.dto'
import { SettlementModel } from '../../models/settlement.model'

@Injectable()
export class SettlementService {
  constructor(
    @InjectModel(SettlementModel)
    private readonly settlementModel: typeof SettlementModel,
  ) {}

  async updateSettlement(id: string, body: UpdateSettlementDto): Promise<void> {
    const settlement = await this.settlementModel.findByPkOrThrow(id)

    await settlement.update({
      liquidatorName: body.liquidatorName,
      liquidatorLocation: body.liquidatorLocation,
      settlementName: body.settlementName,
      settlementNationalId: body.settlementNationalId,
      settlementAddress: body.settlementAddress,
      settlementDeadline: body.settlementDeadline
        ? new Date(body.settlementDeadline)
        : null,
      settlementDateOfDeath: body.settlementDateOfDeath
        ? new Date(body.settlementDateOfDeath)
        : null,
      settlementDeclaredClaims: body.declaredClaims,
    })
  }
}
