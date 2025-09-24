import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  PrimaryKey,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { FeeCodesModel } from '../fee-codes/fee-codes.model'
import { TypeModel } from '../type/type.model'

type AdvertTypeFeeCodeAttributes = {
  advertTypeId: number
  feeCodeId: number
  type: TypeModel
  feeCode: FeeCodesModel
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
  @ForeignKey(() => FeeCodesModel)
  feeCodeId!: number

  @BelongsTo(() => TypeModel)
  type!: TypeModel

  @BelongsTo(() => FeeCodesModel)
  feeCode!: FeeCodesModel
}
