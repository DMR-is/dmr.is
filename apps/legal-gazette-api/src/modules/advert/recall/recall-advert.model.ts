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

import { DivisionTypeEnum, LegalGazetteModels } from '../../../lib/constants'
import { CourtDistrictModel } from '../../court-district/court-district.model'
import { SettlementModel } from '../../settlement/settlement.model'
import { AdvertModel } from '../advert.model'
import { RecallAdvertDto } from './dto/recall-advert.dto'

export const recallAdvertSchema = z.object({
  additionalText: z.string().optional().nullable(),
  judgmentDate: z.string().transform((iso) => new Date(iso)),
  signatureLocation: z.string(),
  signatureDate: z.string().transform((iso) => new Date(iso)),
  settlementId: z.string(),
  courtDistrictId: z.string(),
  advertId: z.string().optional(),
})

export type RecallAdvertAttributes = {
  additionalText?: string | null
  judgmentDate: Date
  signatureLocation: string
  signatureDate: Date
  settlementId: string
  courtDistrictId: string
  advertId: string
}
export type RecallAdvertCreateAttributes = {
  additionalText?: string | null
  judgmentDate: Date
  signatureLocation: string
  signatureDate: Date
  settlementId: string
  courtDistrictId: string
  advertId?: string
}

@DefaultScope(() => ({
  attributes: [
    'id',
    'additionalText',
    'judgmentDate',
    'claimsSentTo',
    'signatureLocation',
    'signatureDate',
    'signatureName',
    'signatureOnBehalfOf',
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
    type: DataType.ENUM(...Object.values(DivisionTypeEnum)),
    allowNull: false,
  })
  type!: DivisionTypeEnum

  @Column({
    type: DataType.TEXT,
    field: 'additional_text',
  })
  additionalText?: string

  @Column({
    type: DataType.DATE,
    field: 'judgment_date',
    allowNull: false,
  })
  judgmentDate!: Date

  @Column({
    field: 'signature_location',
    type: DataType.TEXT,
    allowNull: false,
  })
  signatureLocation!: string

  @Column({
    field: 'signature_date',
    type: DataType.DATE,
    allowNull: false,
  })
  signatureDate!: Date

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
      type: model.type,
      additionalText: model.additionalText,
      judgmentDate: model.judgmentDate.toISOString(),
      signatureLocation: model.signatureLocation,
      signatureDate: model.signatureDate.toISOString(),
      settlement: model.settlement.fromModel(),
      courtDistrict: model.courtDistrict.fromModel(),
    }
  }

  fromModel(): RecallAdvertDto {
    return RecallAdvertModel.fromModel(this)
  }
}
