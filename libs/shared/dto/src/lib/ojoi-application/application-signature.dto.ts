import { IsDateString, IsOptional, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class OJOIApplicationSignatureMember {
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

export class OJOIApplicationSignatureRecord {
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
    description: 'Additional signature name',
  })
  @IsOptional()
  additional?: string

  @ApiProperty({
    type: OJOIApplicationSignatureMember,
    description: 'Chairman of the signature',
  })
  chairman?: OJOIApplicationSignatureMember

  @ApiProperty({
    type: [OJOIApplicationSignatureMember],
    description: 'Members of the signature',
  })
  members!: OJOIApplicationSignatureMember[]
}

export class OJOIApplicationSignatureRecords {
  @ApiProperty({
    type: [OJOIApplicationSignatureRecord],
    description: 'Regular signature',
  })
  records?: OJOIApplicationSignatureRecord[]
}

export class OJOIApplicationSignatures {
  @ApiProperty({
    type: OJOIApplicationSignatureRecords,
    description: 'Regular signature',
  })
  regular?: OJOIApplicationSignatureRecords

  @ApiProperty({
    type: OJOIApplicationSignatureRecords,
    description: 'Committee signature',
  })
  committee?: OJOIApplicationSignatureRecords
}
