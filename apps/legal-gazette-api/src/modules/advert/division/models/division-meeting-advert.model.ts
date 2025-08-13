import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import {
  ApplicationTypeEnum,
  LegalGazetteModels,
} from '../../../../lib/constants'
import { SettlementModel } from '../../../settlement/settlement.model'
import { AdvertModel } from '../../advert.model'
import { DivisionMeetingAdvertDto } from '../dto/division.dto'

export type DivisionMeetingAdvertAttributes = {
  type: ApplicationTypeEnum
  meetingDate: Date
  meetingLocation: string
  settlementId: string
  advertId: string
}

export type DivisionMeetingAdvertCreateAttributes = {
  type: ApplicationTypeEnum
  meetingDate: Date
  meetingLocation: string
  settlementId: string
  advertId?: string
}

@DefaultScope(() => ({
  include: [{ model: SettlementModel }],
}))
@BaseTable({ tableName: LegalGazetteModels.DIVISION_MEETING_ADVERT })
export class DivisionMeetingAdvertModel extends BaseModel<
  DivisionMeetingAdvertAttributes,
  DivisionMeetingAdvertCreateAttributes
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

  static fromModel(
    model: DivisionMeetingAdvertModel,
  ): DivisionMeetingAdvertDto {
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

  fromModel(): DivisionMeetingAdvertDto {
    return DivisionMeetingAdvertModel.fromModel(this)
  }
}
