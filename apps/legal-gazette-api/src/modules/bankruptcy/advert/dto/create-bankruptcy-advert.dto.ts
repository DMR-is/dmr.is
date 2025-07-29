import { Type } from 'class-transformer'
import {
  IsDateString,
  IsDefined,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'

import { ApiProperty, PickType } from '@nestjs/swagger'

import { CreateAdvertDto } from '../../../advert/dto/advert.dto'

class CreateBankruptcyAdvertAttributesDto {
  @ApiProperty({ type: String })
  @IsDateString()
  judgmentDate!: string

  @ApiProperty({ type: String })
  @IsString()
  claimsSentTo!: string

  @ApiProperty({ type: String })
  @IsString()
  signatureLocation!: string

  @ApiProperty({ type: String })
  @IsDateString()
  signatureDate!: string

  @ApiProperty({ type: String })
  @IsString()
  signatureName!: string

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  additionalText?: string | null

  @ApiProperty({ type: String })
  @IsUUID()
  courtDistrictId!: string

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  signatureOnBehalfOf?: string | null
}

export class CreateBankruptcyAdvertDto extends PickType(CreateAdvertDto, [
  'scheduledAt',
] as const) {
  @ApiProperty({
    type: String,
    description: 'The case ID associated with the bankruptcy advert',
  })
  @IsUUID()
  caseId!: string

  @ApiProperty({
    type: CreateBankruptcyAdvertAttributesDto,
    description: 'Attributes for creating a bankruptcy advert',
  })
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateBankruptcyAdvertAttributesDto)
  bankruptcyAdvert!: CreateBankruptcyAdvertAttributesDto
}
