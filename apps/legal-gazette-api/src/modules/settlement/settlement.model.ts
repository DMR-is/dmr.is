import { Column, DataType, DefaultScope } from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { SettlementDto } from './dto/settlement.dto'
type SettlementAttributes = {
  liquidatorName: string
  liquidatorLocation: string
  settlementName: string
  settlementNationalId: string
  settlementAddress: string
  settlementDeadline: Date | null
  settlementDateOfDeath: Date | null
}

type SettlementCreationAttributes = SettlementAttributes

@DefaultScope(() => ({
  attributes: [
    'id',
    'liquidatorName',
    'liquidatorLocation',
    'settlementName',
    'settlementNationalId',
    'settlementAddress',
    'settlementDeadline',
    'settlementDateOfDeath',
  ],
}))
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
    allowNull: false,
    field: 'name',
  })
  settlementName!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'national_id',
  })
  settlementNationalId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'address',
  })
  settlementAddress!: string

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'deadline_date',
  })
  settlementDeadline!: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'date_of_death',
  })
  settlementDateOfDeath!: Date | null

  static fromModel(model: SettlementModel): SettlementDto {
    return {
      liquidatorName: model.liquidatorName,
      liquidatorLocation: model.liquidatorLocation,
      settlementName: model.settlementName,
      settlementNationalId: model.settlementNationalId,
      settlementAddress: model.settlementAddress,
      settlementDeadline: model.settlementDeadline
        ? model.settlementDeadline.toISOString()
        : null,
      settlementDateOfDeath: model.settlementDateOfDeath
        ? model.settlementDateOfDeath.toISOString()
        : null,
    }
  }

  fromModel(): SettlementDto {
    return SettlementModel.fromModel(this)
  }
}
