import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Model,
  PrimaryKey,
} from 'sequelize-typescript'

import { BaseTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import { FeeCodeModel } from './fee-code.model'
import { TypeModel } from './type.model'
import { type TypeModel as TypeModelType } from './type.model'

type AdvertTypeFeeCodeAttributes = {
  advertTypeId: number
  feeCodeId: number
  type: TypeModelType
  feeCode: FeeCodeModel
}

type AdvertTypeFeeCodeCreateAttributes = {
  advertTypeId: number
  feeCodeId: number
}

@DefaultScope(() => ({
  attributes: ['advertTypeId', 'feeCodeId'],
  include: [{ model: TypeModel }, { model: FeeCodeModel }],
}))
@BaseTable({
  modelName: LegalGazetteModels.ADVERT_TYPE_FEE_CODE,
  freezeTableName: true, // Use the exact name of the table (so sequelize does not pluralize it)
  paranoid: false, // No deletedAt
  timestamps: false, // No createdAt or updatedAt
})
export class AdvertTypeFeeCodeModel extends Model<
  AdvertTypeFeeCodeAttributes,
  AdvertTypeFeeCodeCreateAttributes
> {
  @PrimaryKey
  @ForeignKey(() => TypeModel)
  @Column({ type: DataType.UUID, allowNull: false })
  advertTypeId!: number

  @PrimaryKey
  @ForeignKey(() => FeeCodeModel)
  @Column({ type: DataType.UUID, allowNull: false })
  feeCodeId!: number

  @BelongsTo(() => TypeModel)
  type!: TypeModel

  @BelongsTo(() => FeeCodeModel)
  feeCode!: FeeCodeModel
}
