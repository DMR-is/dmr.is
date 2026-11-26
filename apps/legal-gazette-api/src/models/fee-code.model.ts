import { Column, DataType, DefaultScope } from 'sequelize-typescript'

import { ApiProperty } from '@nestjs/swagger'

import { ParanoidModel, ParanoidTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
export interface FeeCodeAttributes {
  feeCode: string
  description: string
  value: number
  isMultiplied: boolean
}

@ParanoidTable({ tableName: LegalGazetteModels.TBR_FEE_CODE })
@DefaultScope(() => ({
  attributes: ['id', 'feeCode', 'description', 'value', 'isMultiplied'],
}))
export class FeeCodeModel extends ParanoidModel<
  FeeCodeAttributes,
  FeeCodeModel
> {
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
}
