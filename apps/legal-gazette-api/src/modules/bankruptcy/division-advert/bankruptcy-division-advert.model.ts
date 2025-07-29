import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Scopes,
} from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { AdvertModel } from '../../advert/advert.model'
import { SettlementModel } from '../../settlement/settlement.model'
import { BankruptcyDivisionAdvertDto } from './dto/bankruptcy-division-advert.dto'

type BankruptcyDivisionAdvertAttributes = {
  meetingDate: Date
  meetingLocation: string
  settlementId: string
  advertId: string
}

export type BankruptcyDivisionAdvertCreationAttributes =
  BankruptcyDivisionAdvertAttributes

@DefaultScope(() => ({
  include: [{ model: SettlementModel }],
}))
@Scopes(() => ({
  withAdvert: {
    include: [{ model: AdvertModel }],
  },
}))
@BaseTable({ tableName: LegalGazetteModels.BANKRUPTCY_DIVISION_ADVERT })
export class BankruptcyDivisionAdvertModel extends BaseModel<
  BankruptcyDivisionAdvertAttributes,
  BankruptcyDivisionAdvertCreationAttributes
> {
  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'meeting_date',
  })
  meetingDate!: Date

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'meeting_location',
  })
  meetingLocation!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'settlement_id',
  })
  @ForeignKey(() => SettlementModel)
  settlementId!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'advert_id',
  })
  @ForeignKey(() => AdvertModel)
  advertId!: string

  @BelongsTo(() => SettlementModel, { foreignKey: 'settlementId' })
  settlement!: SettlementModel

  @BelongsTo(() => AdvertModel, { foreignKey: 'advertId' })
  advert!: AdvertModel

  static fromModel(
    model: BankruptcyDivisionAdvertModel,
  ): BankruptcyDivisionAdvertDto {
    return {
      meetingDate: model.meetingDate.toISOString(),
      meetingLocation: model.meetingLocation,
      settlement: model.settlement.fromModel(),
    }
  }

  fromModel(): BankruptcyDivisionAdvertDto {
    return BankruptcyDivisionAdvertModel.fromModel(this)
  }
}
