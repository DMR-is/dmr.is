import { IsDateString, IsOptional, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

class AdditionalSignature {
  @ApiProperty({
    type: String,
    description: 'Message to the regular',
  })
  @IsOptional()
  regular?: string

  @ApiProperty({
    type: String,
    description: 'Message to the committee',
  })
  @IsOptional()
  committee?: string
}

class ApplicationSignatureMember {
  @ApiProperty({
    type: String,
    description: 'Name of the member',
  })
  @IsString()
  name!: string

  @ApiProperty({
    type: String,
    description: 'Text before the name member',
  })
  @IsOptional()
  before?: string

  @ApiProperty({
    type: String,
    description: 'Text below the name member',
  })
  @IsOptional()
  below?: string

  @ApiProperty({
    type: String,
    description: 'Text above the name member',
  })
  @IsOptional()
  above?: string

  @ApiProperty({
    type: String,
    description: 'Text after the name member',
  })
  @IsOptional()
  after?: string
}

export class ApplicationSignature {
  @ApiProperty({
    type: String,
    description: 'Institution of the signature',
  })
  @IsString()
  institution!: string

  @ApiProperty({
    type: String,
    description: 'Date when the signature was signed',
  })
  @IsDateString()
  date!: string

  @ApiProperty({
    type: [ApplicationSignatureMember],
    description: 'Members of the signature',
  })
  members!: ApplicationSignatureMember[]

  @ApiProperty({
    type: String,
    description: 'The html contents of the signature',
  })
  html!: string
}

export class ApplicationCommitteeSignature extends ApplicationSignature {
  @ApiProperty({
    type: ApplicationSignatureMember,
    description: 'The title of the committee',
  })
  @IsString()
  chairman!: ApplicationSignatureMember
}

/**
 * Properties in this class are set to optional.
 * Because the submittee can only choose either one and not both (regular || committee).
 * Then we use the signature type to determine which one is chosen.
 * @see ApplicationMisc
 */
export class ApplicationSignatures {
  @ApiProperty({
    type: AdditionalSignature,
    example: 'Some message to the applicant',
    description: 'Message to the applicant',
  })
  @IsOptional()
  additionalSignature?: AdditionalSignature

  @ApiProperty({
    type: [ApplicationSignature],
    description: 'Regular signature',
  })
  @IsOptional()
  regular!: ApplicationSignature[]

  @ApiProperty({
    type: ApplicationCommitteeSignature,
    description: 'Committee signature',
  })
  @IsOptional()
  committee!: ApplicationCommitteeSignature
}
