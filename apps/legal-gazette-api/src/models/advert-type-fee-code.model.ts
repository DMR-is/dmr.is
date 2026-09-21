// Association annotations use a type-only alias - see `models.md`.
import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Model,
  PrimaryKey,
} from 'sequelize-typescript'

import { ParanoidTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import type { FeeCodeModel as FeeCodeModelRef } from './fee-code.model'
import { FeeCodeModel } from './fee-code.model'
import type { TypeModel as TypeModelRef } from './type.model'
import { TypeModel } from './type.model'

type AdvertTypeFeeCodeAttributes = {
  advertTypeId: number
  feeCodeId: number
  type: TypeModelRef
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
@ParanoidTable({
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
  type!: TypeModelRef

  @BelongsTo(() => FeeCodeModel)
  feeCode!: FeeCodeModelRef
}
