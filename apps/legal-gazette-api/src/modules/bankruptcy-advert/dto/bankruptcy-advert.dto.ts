import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

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
  signatureClaimsSentTo!: string

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
