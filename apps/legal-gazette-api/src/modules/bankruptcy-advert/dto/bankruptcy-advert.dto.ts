import { Type } from 'class-transformer'
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'

import { ApiProperty, PickType } from '@nestjs/swagger'

import { CreateAdvertDto } from '../../advert/dto/advert.dto'

export class BankruptcyAdvertDto {
  @ApiProperty({
    type: String,
    description: 'Unique identifier for the bankruptcy advert',
  })
  @IsUUID()
  id!: string

  @ApiProperty({
    type: String,
    description: 'The additional text for the bankruptcy advert',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  additionalText?: string | null

  @ApiProperty({
    type: String,
    description: 'The date of the judgment related to the bankruptcy advert',
  })
  @IsDateString()
  judgmentDate!: string

  @ApiProperty({
    type: String,
    description: 'The entity to which claims were sent',
  })
  @IsString()
  claimsSentTo!: string

  @ApiProperty({
    type: String,
    description: 'The location of the signature for the bankruptcy advert',
  })
  @IsString()
  signatureLocation!: string

  @ApiProperty({
    type: String,
    description: 'The date of the signature for the bankruptcy advert',
  })
  @IsDateString()
  signatureDate!: string

  @ApiProperty({
    type: String,
    description: 'The name of the person who signed the bankruptcy advert',
  })
  @IsString()
  signatureName!: string

  @ApiProperty({
    type: String,
    description:
      'The name of the person on behalf of whom the signature was made',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  signatureOnBehalfOf?: string | null

  @ApiProperty({
    type: String,
    description: 'Court district name',
  })
  @IsString()
  courtDistrictName!: string
}

/*

JSON Object of create
{
    "judgmentDate": "2025-07-02T11:48:04.016Z",
    "claimsSentTo": "",
    "signatureLocation": "",
    "signatureDate": "2025-07-02T11:48:04.016Z",
    "signatureName": "",
    "additionalText": "",
    "advertId": "",
    "courtDistrictId": "",
    "signatureOnBehalfOf": ""
}
*/

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
  @ValidateNested()
  @Type(() => CreateBankruptcyAdvertAttributesDto)
  bankruptcyAdvert!: CreateBankruptcyAdvertAttributesDto
}
