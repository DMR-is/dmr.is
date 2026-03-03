import { Type } from 'class-transformer'
import { IsNumber, IsString, ValidateNested } from 'class-validator'

import { ApiProperty, PickType } from '@nestjs/swagger'

import { ApiDateTime, ApiString } from '@dmr.is/decorators'

import { ForeclosureDto } from '../../../../models/foreclosure.model'
import { ObjectIssuer } from '../../dto/external-systems.dto'

export class CreateForeclosurePropertyDto {
  @ApiString()
  propertyName!: string

  @ApiString()
  propertyNumber!: string

  @ApiProperty({ type: Number })
  @IsNumber()
  propertyTotalPrice!: number

  @ApiString()
  claimant!: string

  @ApiString()
  respondent!: string
}

export class CreateForeclosureSaleDto extends PickType(ForeclosureDto, [
  'properties',
] as const) {
  @ApiProperty({
    type: String,
    description: 'The ID of the foreclosure',
    nullable: true,
  })
  @IsString()
  caseNumberIdentifier!: string | null

  @ApiProperty({
    type: String,
    description: 'The land region of where the foreclosure is located',
  })
  @IsString()
  foreclosureRegion!: string

  @ApiString({ description: 'The address of the foreclosure' })
  foreclosureAddress!: string

  @ApiDateTime({
    description: 'The date of the foreclosure',
  })
  foreclosureDate!: Date

  @ApiProperty({
    type: ObjectIssuer,
    description: 'The responsible party for the foreclosure',
  })
  @ValidateNested()
  @Type(() => ObjectIssuer)
  responsibleParty!: ObjectIssuer
}
