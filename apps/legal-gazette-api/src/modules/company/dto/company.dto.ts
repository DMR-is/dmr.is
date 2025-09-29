import { IsBoolean, IsDateString, IsNumber, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class RegisterCompanyDto {
  @ApiProperty({
    type: String,
    description: 'Name of the company',
    example: 'My company',
  })
  @IsString()
  name!: string

  @ApiProperty({
    type: String,
    description: 'SSN or kennitala of the company',
    example: '1234567890',
  })
  @IsString()
  nationalId!: string

  @ApiProperty({
    type: String,
    description: 'Address of the company',
    example: 'Laugavegur 1, 101 Reykjavik',
  })
  @IsString()
  registeredAddress!: string

  @ApiProperty({
    type: String,
    description: 'Date when the company was accepted',
    example: '2023-10-01T12:00:00Z (ISO 8601 format)',
  })
  @IsDateString()
  approvedDate!: string

  @ApiProperty({
    type: String,
    description: 'Date when the board was established',
    example: '2023-10-01T12:00:00Z (ISO 8601 format)',
  })
  @IsDateString()
  boardAppointed!: string

  @ApiProperty({
    type: String,
    description: 'Stjórnarmaður: Nafn.., varastjórn: nafn, kt..',
    example: 'John Doe, Jane Smith',
  })
  @IsString()
  boardMembers!: string

  @ApiProperty({
    type: String,
    example:
      'Ef einn í stjórn:  Stjórnarmaður, ef stjórn er fjölskipuð: Meirihluti stjórnar',
  })
  @IsString()
  signingAuthority!: string

  @ApiProperty({
    type: String,
    description: 'John Doe',
    example: 'Nafn framkvæmdastjóra',
  })
  @IsString()
  managingDirector!: string

  @ApiProperty({
    type: String,
    description: 'John Doe',
    example: 'Nafn prókúruhafa',
  })
  @IsString()
  procuration!: string

  @ApiProperty({
    type: String,
    description: 'John Doe',
    example: 'Nafn endurskoðanda',
  })
  @IsString()
  auditor!: string

  @ApiProperty({
    type: Number,
    description: 'Hlutafé í kr.',
    example: 1000000,
  })
  @IsNumber()
  capital!: number

  @ApiProperty({
    type: String,
    description: 'Tilgangur fyrirtækis',
    example: 'Að reka veitingahús',
  })
  @IsString()
  purpose!: string

  @ApiProperty({
    type: Boolean,
    description: 'Eru hömlur? ',
    example: false,
  })
  @IsBoolean()
  benefits!: boolean

  @ApiProperty({
    type: String,
    description: 'Lausnarskylda',
    example: 'John Doe',
  })
  @IsString()
  liquidationObligation!: string
}
