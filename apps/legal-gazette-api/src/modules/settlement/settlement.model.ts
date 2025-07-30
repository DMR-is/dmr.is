import { Column, DataType, HasMany } from 'sequelize-typescript'
import { z } from 'zod'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { BankruptcyAdvertModel } from '../bankruptcy/advert/bankruptcy-advert.model'
import { BankruptcyDivisionAdvertModel } from '../bankruptcy/division-advert/bankruptcy-division-advert.model'
import { SettlementDto } from './dto/settlement.dto'

type SettlementAttributes = {
  liquidatorName: string
  liquidatorLocation: string
  liquidatorOnBehalfOf?: string

  settlementName: string
  settlementNationalId: string
  settlementAddress: string
  settlementDeadline: Date
}

type SettlementCreationAttributes = SettlementAttributes

export const settlementSchema = z.object({
  liquidatorName: z.string(),
  liquidatorLocation: z.string(),
  liquidatorOnBehalfOf: z.string().optional(),
  settlementName: z.string(),
  settlementNationalId: z.string(),
  settlementAddress: z.string(),
  settlementDeadline: z.string().transform((iso) => new Date(iso)),
})

@BaseTable({ tableName: LegalGazetteModels.SETTLEMENT })
export class SettlementModel extends BaseModel<
  SettlementAttributes,
  SettlementCreationAttributes
> {
  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'liquidator_name',
  })
  liquidatorName!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'liquidator_location',
  })
  liquidatorLocation!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'liquidator_on_behalf_of',
  })
  liquidatorOnBehalfOf?: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'settlement_name',
  })
  settlementName!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'settlement_national_id',
  })
  settlementNationalId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'settlement_address',
  })
  settlementAddress!: string

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'settlement_deadline',
  })
  settlementDeadline!: Date

  @HasMany(() => BankruptcyAdvertModel)
  bankruptcyAdverts!: BankruptcyAdvertModel

  @HasMany(() => BankruptcyDivisionAdvertModel, {
    foreignKey: 'settlementId',
  })
  bankruptcyDivisionAdverts!: BankruptcyDivisionAdvertModel[]

  static fromModel(model: SettlementModel): SettlementDto {
    return {
      liquidatorName: model.liquidatorName,
      liquidatorLocation: model.liquidatorLocation,
      liquidatorOnBehalfOf: model.liquidatorOnBehalfOf,
      settlementName: model.settlementName,
      settlementNationalId: model.settlementNationalId,
      settlementAddress: model.settlementAddress,
      settlementDeadline: model.settlementDeadline,
    }
  }

  fromModel(): SettlementDto {
    return SettlementModel.fromModel(this)
  }
}
