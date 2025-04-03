import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsString, IsOptional, IsNumber } from 'class-validator'

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

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  customBodyLengthCount?: number

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
