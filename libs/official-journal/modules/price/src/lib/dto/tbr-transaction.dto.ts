import { Transform } from 'class-transformer'
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator'

import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { PaymentExpenses } from './payment.dto'

export class TBRTransaction {
  @ApiProperty({
    type: String,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  readonly id!: string

  @ApiProperty({
    type: String,
    description: 'Reference to external source',
  })
  readonly externalReference!: string

  @ApiProperty({
    type: String,
    description: 'Image tier code',
  })
  readonly imageTier!: string | null

  @ApiProperty({
    type: Number,
    description: 'Advert price',
    required: false,
  })
  readonly price!: number | null

  @ApiProperty({
    type: String,
    description: 'Advert subject (Viðfang).',
    required: false,
  })
  readonly subject!: string | null

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Fee codes to get the price for',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  readonly feeCodes!: string[] | null

  @ApiProperty({
    type: Number,
    description: 'How many base units are there',
    required: false,
  })
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  readonly customBaseCount!: number | null

  @ApiProperty({
    type: Number,
    description: 'How many additional documents are there',
    required: false,
  })
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  readonly customAdditionalDocCount!: number | null

  @ApiProperty({
    type: Number,
    description: 'How much extra work is there, in percentage',
    required: false,
  })
  readonly extraWorkCount!: number | null

  @ApiProperty({
    type: Number,
    description: 'Custom additional character count',
    required: false,
  })
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  readonly customAdditionalCharacterCount!: number | null
}

export class PriceByDepartmentResponse extends PartialType(
  OmitType(TBRTransaction, ['id'] as const),
) {
  @ApiProperty({
    type: [PaymentExpenses],
    description: 'Department code',
  })
  expenses!: PaymentExpenses[]
}
