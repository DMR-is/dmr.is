import { Transform } from 'class-transformer'
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateCasePriceBody {
  @ApiProperty({
    type: [String],
    required: false,
    description: 'Fee codes to get the price for',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  feeCodes?: string[]

  @ApiProperty({
    type: String,
    required: false,
    description: 'Tier of the image',
  })
  @IsOptional()
  @IsString()
  imageTier?: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'Viðfang (subject)',
  })
  @IsOptional()
  @IsString()
  subject?: string

  @ApiProperty({
    type: Number,
    required: false,
    description: 'How much extra work is there, in percentage',
  })
  @IsOptional()
  @IsNumber()
  extraWorkCount?: number

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Base document count',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  customBaseDocumentCount?: number

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Additional document count',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  customAdditionalDocCount?: number

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Length of the body',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  customBodyLengthCount?: number
}

export class CaseFeeCalculationBody {
  @ApiProperty({
    type: String,
    required: true,
    description: 'Slug of the case',
  })
  @IsString()
  slug!: string

  @ApiProperty({
    type: Boolean,
    required: false,
    description: 'Is the case fast track',
  })
  @IsOptional()
  @Transform(({ value }) => (value ? value === 'true' : undefined))
  isFastTrack?: boolean

  @ApiProperty({
    type: String,
    required: false,
    description: 'Tier of the image',
  })
  @IsOptional()
  @IsString()
  imageTier?: string

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Base document count',
  })
  @IsOptional()
  baseDocumentCount?: number

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Additional document count',
  })
  @IsOptional()
  additionalDocCount?: number

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Length of the body',
  })
  @IsOptional()
  bodyLengthCount?: number

  @ApiProperty({
    type: Number,
    required: false,
    description: 'How much extra work is there, in percentage',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  extraWorkCount?: number
}
