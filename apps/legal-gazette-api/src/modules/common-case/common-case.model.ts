import { BelongsTo, Column, DataType, DefaultScope } from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { CaseModel } from '@dmr.is/modules'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

type CommonCaseAttributes = {
  caption: string
  html: string
  signatureName: string
  signatureLocation: string
  signatureDate: Date
}

type CommonCaseCreationAttributes = CommonCaseAttributes

@BaseTable({ tableName: LegalGazetteModels.COMMON_CASE })
@DefaultScope(() => ({
  attributes: [
    'id',
    'caption',
    'html',
    'signatureName',
    'signatureLocation',
    'signatureDate',
  ],
}))
export class CommonCaseModel extends BaseModel<
  CommonCaseAttributes,
  CommonCaseCreationAttributes
> {
  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'caption',
  })
  caption!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'html',
  })
  html!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'signature_name',
  })
  signatureName!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'signature_location',
  })
  signatureLocation!: string

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'signature_date',
  })
  signatureDate!: Date

  @BelongsTo(() => CaseModel, { foreignKey: 'id' })
  case!: CaseModel
}
