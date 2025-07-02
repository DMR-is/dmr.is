import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { AdvertModel } from '../../advert/advert.model'
import { CourtDistrictModel } from '../../court-district/court-district.model'
import { BankruptcyAdvertDto } from '../dto/bankruptcy-advert.dto'

type BankruptcyAdvertAttributes = {
  id: string
  additionalText: string | null
  judgmentDate: Date
  signatureClaimsSentTo: string
  signatureLocation: string
  signatureDate: Date
  signatureName: string
  signatureOnBehalfOf: string | null
  courtDistrictId: string
  advertId: string

  courtDistrict: CourtDistrictModel
  advert: AdvertModel
}
type BankruptcyAdvertCreationAttributes = {
  additionalText?: string | null
  judgmentDate: Date
  signatureClaimsSentTo: string
  signatureLocation: string
  signatureDate: Date
  signatureName: string
  signatureOnBehalfOf?: string | null
  courtDistrictId?: string
  advertId?: string
}

@DefaultScope(() => ({
  attributes: [
    'id',
    'additionalText',
    'judgmentDate',
    'signatureClaimsSentTo',
    'signatureLocation',
    'signatureDate',
    'signatureName',
    'signatureOnBehalfOf',
  ],
  include: [{ model: CourtDistrictModel, attributes: ['id', 'title'] }],
}))
@BaseTable({ tableName: LegalGazetteModels.BANKRUPTCY_ADVERT })
export class BankruptcyAdvertModel extends BaseModel<
  BankruptcyAdvertAttributes,
  BankruptcyAdvertCreationAttributes
> {
  @Column({
    field: 'additional_text',
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  additionalText!: string | null

  @Column({
    field: 'judgment_date',
    type: DataType.DATE,
    allowNull: false,
  })
  judgmentDate!: Date

  @Column({
    field: 'signature_claims_sent_to',
    type: DataType.TEXT,
    allowNull: false,
  })
  signatureClaimsSentTo!: string

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
    field: 'signature_name',
    type: DataType.TEXT,
    allowNull: false,
  })
  signatureName!: string

  @Column({
    field: 'signature_on_behalf_of',
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  signatureOnBehalfOf!: string | null

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
      signatureClaimsSentTo: model.signatureClaimsSentTo,
      signatureLocation: model.signatureLocation,
      signatureDate: model.signatureDate.toISOString(),
      signatureName: model.signatureName,
      signatureOnBehalfOf: model.signatureOnBehalfOf,
      courtDistrictName: model.courtDistrict.title,
    }
  }

  fromModel(): BankruptcyAdvertDto {
    return BankruptcyAdvertModel.fromModel(this)
  }
}
