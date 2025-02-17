import { IsDateString, IsOptional, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class ApplicationSignatureMember {
  @ApiProperty({
    type: String,
    description: 'Name of the member',
  })
  @IsString()
  name!: string

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

export class ApplicationSignatureRecord {
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
  signatureDate!: string

  @ApiProperty({
    type: String,
    description: 'Additioanl signature name',
  })
  @IsOptional()
  additional?: string

  @ApiProperty({
    type: ApplicationSignatureMember,
    description: 'Chairman of the signature',
  })
  chairman?: ApplicationSignatureMember

  @ApiProperty({
    type: [ApplicationSignatureMember],
    description: 'Members of the signature',
  })
  members!: ApplicationSignatureMember[]
}

export class ApplicationSignatureRecords {
  @ApiProperty({
    type: [ApplicationSignatureRecord],
    description: 'Regular signature',
  })
  records?: ApplicationSignatureRecord[]
}

export class ApplicationSignatures {
  @ApiProperty({
    type: ApplicationSignatureRecords,
    description: 'Regular signature',
  })
  regular?: ApplicationSignatureRecords

  @ApiProperty({
    type: ApplicationSignatureRecords,
    description: 'Committee signature',
  })
  committee?: ApplicationSignatureRecords
}
