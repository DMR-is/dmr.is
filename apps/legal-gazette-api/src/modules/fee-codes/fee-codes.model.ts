import { Column, DataType } from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { FeeCodeDto } from './dto/fee-codes.dto'

export interface FeeCodesAttributes {
  feeCode: string
  description: string
  value: number
  isMultiplied: boolean
}

@BaseTable({ tableName: LegalGazetteModels.TBR_FEE_CODES })
export class FeeCodesModel extends BaseModel<
  FeeCodesAttributes,
  FeeCodesModel
> {
  @Column({ type: DataType.TEXT })
  feeCode!: string

  @Column({ type: DataType.TEXT })
  description!: string

  @Column({ type: DataType.NUMBER })
  value!: number

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isMultiplied!: boolean

  static fromModel(model: FeeCodesModel): FeeCodeDto {
    return {
      id: model.id,
      feeCode: model.feeCode,
      description: model.description,
      value: model.value,
      isMultiplied: model.isMultiplied,
    }
  }

  fromModel(): FeeCodeDto {
    return FeeCodesModel.fromModel(this)
  }
}
