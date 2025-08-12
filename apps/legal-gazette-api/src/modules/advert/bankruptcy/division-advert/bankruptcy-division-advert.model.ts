import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Scopes,
} from 'sequelize-typescript'
import { z } from 'zod'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../../../lib/constants'
import { SettlementModel } from '../../../settlement/settlement.model'
import { AdvertModel } from '../../advert.model'
import { BankruptcyDivisionAdvertDto } from './dto/bankruptcy-division-advert.dto'

export const bankruptcyDivisionAdvertSchema = z.object({
  meetingDate: z.string().datetime(),
  meetingLocation: z.string(),
  settlementId: z.string().uuid(),
  advertId: z.string().uuid().optional(),
})

type BankruptcyDivisionAdvertAttributes = {
  meetingDate: string
  meetingLocation: string
  settlementId: string
  advertId: string
}

export type BankruptcyDivisionAdvertCreationAttributes = {
  meetingDate: string
  meetingLocation: string
  settlementId: string
  advertId?: string
}

@DefaultScope(() => ({
  include: [{ model: SettlementModel }],
}))
@Scopes(() => ({
  withAdvert: {
    include: [{ model: AdvertModel }],
  },
}))
@BaseTable({ tableName: LegalGazetteModels.DIVISION_MEETING_ADVERT })
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
      id: model.id,
      meetingDate: model.meetingDate.toISOString(),
      meetingLocation: model.meetingLocation,
      settlement: model.settlement.fromModel(),
    }
  }

  fromModel(): BankruptcyDivisionAdvertDto {
    return BankruptcyDivisionAdvertModel.fromModel(this)
  }
}
