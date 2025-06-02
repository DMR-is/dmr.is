import { BelongsTo, Column, DataType, DefaultScope } from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { CaseModel } from '@dmr.is/modules'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

type CommonAdvertAttributes = {
  caption: string
  signatureName: string
  signatureLocation: string
  signatureDate: Date
}

export type CommonAdvertCreationAttributes = CommonAdvertAttributes

@BaseTable({ tableName: LegalGazetteModels.COMMON_ADVERT })
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
export class CommonAdvertModel extends BaseModel<
  CommonAdvertAttributes,
  CommonAdvertCreationAttributes
> {
  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'caption',
  })
  caption!: string

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
