import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Scopes,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels, RecallTypeEnum } from '../../../lib/constants'
import { CourtDistrictModel } from '../../court-district/court-district.model'
import { SettlementModel } from '../../settlement/settlement.model'
import { AdvertModel } from '../advert.model'
import { RecallAdvertDto } from './dto/recall-advert.dto'

export type RecallAdvertAttributes = {
  recallType: RecallTypeEnum
  additionalText?: string | null
  signatureLocation: string
  signatureDate: Date
  settlementId: string
  courtDistrictId: string
  advertId: string
}
export type RecallAdvertCreateAttributes = {
  recallType: RecallTypeEnum
  additionalText?: string | null
  signatureLocation: string
  signatureDate: Date
  settlementId: string
  courtDistrictId: string
  advertId?: string
}

@DefaultScope(() => ({
  attributes: [
    'id',
    'recallType',
    'advertId',
    'courtDistrictId',
    'settlementId',
    'additionalText',
    'signatureLocation',
    'signatureDate',
    'signatureName',
  ],
  include: [{ model: CourtDistrictModel }, { model: SettlementModel }],
}))
@Scopes(() => ({
  withAdvert: {
    include: [{ model: AdvertModel }],
  },
}))
@BaseTable({ tableName: LegalGazetteModels.RECALL_ADVERT })
export class RecallAdvertModel extends BaseModel<
  RecallAdvertAttributes,
  RecallAdvertCreateAttributes
> {
  @Column({
    type: DataType.ENUM(...Object.values(RecallTypeEnum)),
    allowNull: false,
    field: 'recall_type',
  })
  recallType!: RecallTypeEnum

  @Column({
    type: DataType.TEXT,
    field: 'additional_text',
  })
  additionalText?: string

  @Column({
    field: 'settlement_id',
    type: DataType.UUID,
    allowNull: false,
  })
  @ForeignKey(() => SettlementModel)
  settlementId!: string

  @Column({
    field: 'court_district_id',
    type: DataType.UUID,
    allowNull: false,
  })
  @ForeignKey(() => CourtDistrictModel)
  courtDistrictId!: string

  @Column({
    field: 'advert_id',
    type: DataType.UUID,
    allowNull: false,
  })
  @ForeignKey(() => AdvertModel)
  advertId!: string

  @BelongsTo(() => SettlementModel, {
    foreignKey: 'settlementId',
  })
  settlement!: SettlementModel

  @BelongsTo(() => CourtDistrictModel, {
    foreignKey: 'courtDistrictId',
  })
  courtDistrict!: CourtDistrictModel

  @BelongsTo(() => AdvertModel, {
    foreignKey: 'advertId',
  })
  advert!: AdvertModel

  static fromModel(model: RecallAdvertModel): RecallAdvertDto {
    return {
      id: model.id,
      recallType: model.recallType,
      additionalText: model.additionalText,
      settlement: model.settlement.fromModel(),
      courtDistrict: model.courtDistrict.fromModel(),
    }
  }

  fromModel(): RecallAdvertDto {
    return RecallAdvertModel.fromModel(this)
  }
}
