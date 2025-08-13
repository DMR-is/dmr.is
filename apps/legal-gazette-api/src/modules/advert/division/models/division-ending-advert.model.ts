import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import {
  ApplicationTypeEnum,
  LegalGazetteModels,
} from '../../../../lib/constants'
import { SettlementModel } from '../../../settlement/settlement.model'
import { AdvertModel } from '../../advert.model'
import { DivisionEndingAdvertDto } from '../dto/division.dto'

export type DivisionEndingAdvertAttributes = {
  type: ApplicationTypeEnum
  meetingDate: Date
  meetingLocation: string
  settlementId: string
  advertId: string
}

export type DivisionEndingAdvertCreateAttributes = {
  type: ApplicationTypeEnum
  meetingDate: Date
  meetingLocation: string
  settlementId: string
  advertId?: string
}

@BaseTable({ tableName: LegalGazetteModels.DIVISION_ENDING_ADVERT })
export class DivisionEndingAdvertModel extends BaseModel<
  DivisionEndingAdvertAttributes,
  DivisionEndingAdvertCreateAttributes
> {
  @Column({
    type: DataType.ENUM(...Object.values(ApplicationTypeEnum)),
    allowNull: false,
  })
  type!: ApplicationTypeEnum

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

  get meetingTime(): string {
    const date = this.getDataValue('meetingDate')

    return date.toTimeString().split(' ')[0]
  }

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

  @BelongsTo(() => SettlementModel, {
    foreignKey: 'settlementId',
  })
  settlement!: SettlementModel

  @BelongsTo(() => AdvertModel, {
    foreignKey: 'advertId',
  })
  advert!: AdvertModel

  static fromModel(model: DivisionEndingAdvertModel): DivisionEndingAdvertDto {
    return {
      id: model.id,
      advertId: model.advertId,
      type: model.type,
      meetingDate: model.meetingDate,
      meetingLocation: model.meetingLocation,
      meetingTime: model.meetingTime,
      settlement: SettlementModel.fromModel(model.settlement),
    }
  }

  fromModel(): DivisionEndingAdvertDto {
    return DivisionEndingAdvertModel.fromModel(this)
  }
}
