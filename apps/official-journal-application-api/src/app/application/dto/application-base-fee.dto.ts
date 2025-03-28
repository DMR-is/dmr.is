import { AdvertFeeTypeEnum } from '@dmr.is/official-journal/models'
import { ApiProperty } from '@nestjs/swagger'

export class TransactionFeeCode {
  @ApiProperty({
    description: 'Unique ID for the fee code, GUID format.',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
    type: String,
  })
  readonly id!: string

  @ApiProperty({
    description: 'Unique fee code identifier.',
    example: 'A101',
    required: true,
    type: String,
  })
  readonly feeCode!: string

  @ApiProperty({
    description: 'Detailed description of the fee.',
    required: true,
    type: String,
  })
  readonly description!: string

  @ApiProperty({
    description: 'Type of fee',
    example: 'BASE',
    required: true,
    enum: AdvertFeeTypeEnum,
  })
  readonly feeType!: AdvertFeeTypeEnum

  @ApiProperty({
    description:
      'Fee amount if fixed, or percentage multiplier if percentage-based.',
    example: 7000,
    required: true,
    type: Number,
  })
  readonly value!: number

  @ApiProperty({
    required: true,
    description: 'Department the fee code is associated with.',
    type: String,
  })
  readonly department!: string
}

export class TransactionFeeCodesResponse {
  @ApiProperty({
    description: 'List of fee codes',
    required: true,
    type: [TransactionFeeCode],
  })
  readonly codes!: Array<TransactionFeeCode>
}
