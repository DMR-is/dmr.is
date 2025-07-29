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
import { CourtDistrictModel } from '../../court-district/court-district.model'
import { SettlementModel } from '../../settlement/settlement.model'
import { BankruptcyAdvertDto } from './dto/bankruptcy-advert.dto'

export type BankruptcyAdvertAttributes = {
  additionalText?: string
  judgmentDate: Date
  signatureLocation: string
  signatureDate: Date
  settlementId: string
  courtDistrictId: string
  advertId: string
}
export type BankruptcyAdvertCreationAttributes = BankruptcyAdvertAttributes

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
@BaseTable({ tableName: LegalGazetteModels.BANKRUPTCY_ADVERT })
export class BankruptcyAdvertModel extends BaseModel<
  BankruptcyAdvertAttributes,
  BankruptcyAdvertCreationAttributes
> {
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

  static fromModel(model: BankruptcyAdvertModel): BankruptcyAdvertDto {
    return {
      id: model.id,
      additionalText: model.additionalText,
      judgmentDate: model.judgmentDate.toISOString(),
      signatureLocation: model.signatureLocation,
      signatureDate: model.signatureDate.toISOString(),
      settlement: model.settlement.fromModel(),
      courtDistrict: model.courtDistrict.fromModel(),
    }
  }

  fromModel(): BankruptcyAdvertDto {
    return BankruptcyAdvertModel.fromModel(this)
  }
}
