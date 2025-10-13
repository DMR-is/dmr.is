import { Type } from 'class-transformer'
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'

import { ApiProperty, OmitType } from '@nestjs/swagger'

export class ForeclosurePropertyDto {
  @ApiProperty({ type: String })
  @IsUUID()
  id!: string

  @ApiProperty({
    type: String,
    description: 'The ID of the foreclosure this property belongs to',
  })
  @IsUUID()
  foreclosureId!: string

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'The date and time when the property was created',
  })
  @IsDateString()
  createdAt!: string

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'The date and time when the property was last updated',
  })
  @IsDateString()
  updatedAt!: string

  @ApiProperty({ type: String, description: 'The name of the property' })
  @IsString()
  propertyName!: string

  @ApiProperty({
    type: String,
    description: 'The number of the property (fastanúmer)',
  })
  @IsString()
  propertyNumber!: string

  @ApiProperty({ type: String, description: 'The address of the property' })
  @IsString()
  propertyAddress!: string

  @ApiProperty({ type: Number, description: 'The total price of the property' })
  @IsNumber()
  propertyTotalPrice!: number

  @ApiProperty({ type: String, description: 'Respondent name (Gerðarþoli/ar)' })
  @IsString()
  respondent!: string

  @ApiProperty({
    type: String,
    description: 'The name of the claimant (Gerðarbeiðandi)',
  })
  @IsString()
  claimant!: string
}

export class CreateForeclosurePropertyDto extends OmitType(
  ForeclosurePropertyDto,
  ['id', 'createdAt', 'updatedAt', 'foreclosureId'] as const,
) {}

export class ForeclosureDto {
  @ApiProperty({ type: String, description: 'The ID of the foreclosure' })
  @IsUUID()
  id!: string

  @ApiProperty({
    type: String,
    description: 'The ID of the advert the foreclosure belongs to',
  })
  @IsUUID()
  advertId!: string

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'The date and time when the foreclosure was created',
  })
  @IsDateString()
  createdAt!: string

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'The date and time when the foreclosure was last updated',
  })
  @IsDateString()
  updatedAt!: string

  @ApiProperty({
    type: String,
    description: 'The land region of where the foreclosure is located',
  })
  foreclosureRegion!: string

  @ApiProperty({ type: String, description: 'The address of the foreclosure' })
  @IsString()
  foreclosureAddress!: string

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'The date of the foreclosure',
  })
  @IsDateString()
  foreclosureDate!: string
}

export class CreateForeclosureSaleDto extends OmitType(ForeclosureDto, [
  'id',
  'createdAt',
  'updatedAt',
  'advertId',
] as const) {
  @ApiProperty({
    type: [CreateForeclosurePropertyDto],
    description: 'List of all the properties listed in the foreclosure',
  })
  @IsArray()
  @Type(() => CreateForeclosurePropertyDto)
  @ValidateNested({ each: true })
  properties!: CreateForeclosurePropertyDto[]
}
