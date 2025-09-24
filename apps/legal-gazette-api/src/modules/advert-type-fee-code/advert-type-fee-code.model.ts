import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  PrimaryKey,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { FeeCodeModel } from '../fee-code/fee-code.model'
import { TypeModel } from '../type/type.model'

type AdvertTypeFeeCodeAttributes = {
  advertTypeId: number
  feeCodeId: number
  type: TypeModel
  feeCode: FeeCodeModel
}

type AdvertTypeFeeCodeCreateAttributes = {
  advertTypeId: number
  feeCodeId: number
}

@BaseTable({ modelName: LegalGazetteModels.ADVERT_TYPE_FEE_CODE })
export class AdvertTypeFeeCodeModel extends BaseModel<
  AdvertTypeFeeCodeAttributes,
  AdvertTypeFeeCodeCreateAttributes
> {
  @PrimaryKey
  @Column({ type: DataType.UUID })
  @ForeignKey(() => TypeModel)
  advertTypeId!: number

  @PrimaryKey
  @Column({ type: DataType.UUID })
  @ForeignKey(() => FeeCodeModel)
  feeCodeId!: number

  @BelongsTo(() => TypeModel)
  type!: TypeModel

  @BelongsTo(() => FeeCodeModel)
  feeCode!: FeeCodeModel
}
