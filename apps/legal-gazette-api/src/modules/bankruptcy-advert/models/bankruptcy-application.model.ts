import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { CaseModel } from '../../case/case.model'
import { CourtDistrictModel } from '../../court-district/court-district.model'

type BankruptcyApplicationAttributes = {
  additionalText?: string | null
  judgmentDate?: Date | null
  claimsSentTo?: string | null

  signatureLocation?: string | null
  signatureDate?: Date | null
  signatureName?: string | null
  signatureOnBehalfOf?: string | null

  publishingDates?: Date[] | null

  courtDistrictId?: string | null
  caseId: string
}

type BankruptcyApplicationCreationAttributes = BankruptcyApplicationAttributes

@DefaultScope(() => ({
  attributes: [
    'additionalText',
    'judgmentDate',
    'claimsSentTo',
    'signatureLocation',
    'signatureDate',
    'signatureName',
    'signatureOnBehalfOf',
    'publishingDates',
    'courtDistrictId',
    'caseId',
  ],
  include: [
    {
      model: CourtDistrictModel,
      as: 'courtDistrict',
      attributes: ['id', 'title', 'slug'],
    },
  ],
}))
@BaseTable({ tableName: LegalGazetteModels.BANKRUPTCY_APPLICATION })
export class BankruptcyApplicationModel extends BaseModel<
  BankruptcyApplicationAttributes,
  BankruptcyApplicationCreationAttributes
> {
  @Column({
    type: DataType.TEXT,
    field: 'additional_text',
    allowNull: true,
  })
  additionalText!: string | null

  @Column({
    type: DataType.DATE,
    field: 'judgment_date',
    allowNull: true,
  })
  judgmentDate!: Date | null

  @Column({
    type: DataType.STRING,
    field: 'claims_sent_to',
    allowNull: true,
  })
  claimsSentTo!: string | null

  @Column({
    type: DataType.STRING,
    field: 'signature_location',
    allowNull: true,
  })
  signatureLocation!: string | null

  @Column({
    type: DataType.DATE,
    field: 'signature_date',
    allowNull: true,
  })
  signatureDate!: Date | null

  @Column({
    type: DataType.STRING,
    field: 'signature_name',
    allowNull: true,
  })
  signatureName!: string | null

  @Column({
    type: DataType.STRING,
    field: 'signature_on_behalf_of',
    allowNull: true,
  })
  signatureOnBehalfOf!: string | null

  @Column({
    type: DataType.ARRAY(DataType.DATE),
    field: 'publishing_dates',
    allowNull: true,
  })
  publishingDates!: Date[] | null

  @Column({
    type: DataType.STRING,
    field: 'court_district_id',
    allowNull: true,
  })
  @ForeignKey(() => CourtDistrictModel)
  courtDistrictId!: string | null

  @Column({
    type: DataType.STRING,
    field: 'case_id',
    allowNull: false,
  })
  @ForeignKey(() => CaseModel)
  caseId!: string

  @BelongsTo(() => CourtDistrictModel, { foreignKey: 'courtDistrictId' })
  courtDistrict?: CourtDistrictModel

  @BelongsTo(() => CaseModel, { foreignKey: 'caseId' })
  case!: CaseModel
}
