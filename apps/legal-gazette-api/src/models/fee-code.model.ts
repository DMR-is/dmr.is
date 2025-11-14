import { Column, DataType, DefaultScope } from 'sequelize-typescript'

import { ApiProperty, PickType } from '@nestjs/swagger'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
export interface FeeCodeAttributes {
  feeCode: string
  description: string
  value: number
  isMultiplied: boolean
}

@BaseTable({ tableName: LegalGazetteModels.TBR_FEE_CODE })
@DefaultScope(() => ({
  attributes: ['id', 'feeCode', 'description', 'value', 'isMultiplied'],
}))
export class FeeCodeModel extends BaseModel<FeeCodeAttributes, FeeCodeModel> {
  @Column({ type: DataType.TEXT })
  @ApiProperty({ type: String })
  feeCode!: string

  @Column({ type: DataType.TEXT })
  @ApiProperty({ type: String })
  description!: string

  @Column({ type: DataType.NUMBER })
  @ApiProperty({ type: Number })
  value!: number

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  @ApiProperty({ type: Boolean })
  isMultiplied!: boolean

  static fromModel(model: FeeCodeModel): FeeCodeDto {
    return {
      id: model.id,
      feeCode: model.feeCode,
      description: model.description,
      value: model.value,
      isMultiplied: model.isMultiplied,
    }
  }

  fromModel(): FeeCodeDto {
    return FeeCodeModel.fromModel(this)
  }
}

export class FeeCodeDto extends PickType(FeeCodeModel, [
  'id',
  'feeCode',
  'description',
  'value',
  'isMultiplied',
] as const) {}

export class GetFeeCodesResponse {
  @ApiProperty({ type: [FeeCodeDto] })
  feeCodes!: FeeCodeDto[]
}
