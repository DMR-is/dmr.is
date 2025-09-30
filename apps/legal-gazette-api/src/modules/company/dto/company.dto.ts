import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsDefined,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class ResponsiblePartyDto {
  @ApiProperty({
    type: String,
    description: 'Name of the party responsible for the advert',
    example: 'John Doe',
  })
  @IsString()
  name!: string

  @ApiProperty({
    type: String,
    description: 'The national id of who is responsible for the advert',
    example: '1234567890',
  })
  @IsString()
  nationalId!: string

  @ApiProperty({
    type: String,
    description: 'The name of the person signing the advert',
    example: 'Jón Jónsson',
  })
  @IsString()
  signatureName!: string

  @ApiProperty({
    type: String,
    description: 'The location where the responsible party signed the advert',
    example: 'Reykjavík',
  })
  @IsString()
  signatureLocation!: string

  @ApiProperty({
    type: String,
    description:
      'The date when the responsible party signed the advert in ISO 8601 format',
    example: '2023-10-01T12:00:00Z',
  })
  @IsDateString()
  signatureDate!: string

  @ApiProperty({
    type: String,
    description:
      'The name of the person signing on behalf of the responsible party prefixed with f.h.',
    example: 'Jón Jónsson',
    required: false,
  })
  @IsOptional()
  @IsString()
  signatureOnBehalfOf?: string
}

export class PartyEntityDto {
  @ApiProperty({
    type: String,
    description: 'Name of the party',
    example: 'John Doe',
  })
  @IsString()
  name!: string

  @ApiProperty({
    type: String,
    description: 'National id of the party',
    example: '1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  nationalId?: string

  @ApiProperty({
    type: String,
    description: 'Address of the party',
    example: 'Laugavegur 1, 101 Reykjavik',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string
}

export class CompanyChairmanDto {
  @ApiProperty({
    type: PartyEntityDto,
    description: 'The chairman of the company',
  })
  @IsDefined()
  @Type(() => PartyEntityDto)
  @ValidateNested()
  chairman!: PartyEntityDto

  @ApiProperty({
    type: PartyEntityDto,
    description: 'The vice chairman of the company',
    required: false,
  })
  @IsOptional()
  @Type(() => PartyEntityDto)
  @ValidateNested()
  viceChairman?: PartyEntityDto
}

export class CompanyBoardDto {
  @ApiProperty({
    type: PartyEntityDto,
    description: 'A board member of the company',
  })
  @IsDefined()
  @Type(() => PartyEntityDto)
  @ValidateNested()
  boardMember!: PartyEntityDto

  @ApiProperty({
    type: PartyEntityDto,
    description: 'The vice chairman of the company',
    required: false,
  })
  @IsOptional()
  @Type(() => PartyEntityDto)
  @ValidateNested()
  deputyMember?: PartyEntityDto
}

export class CompanyCreatorDto {
  @ApiProperty({
    type: String,
    description: 'Name of the company creator',
    example: 'John Doe',
  })
  @IsString()
  name!: string

  @ApiProperty({
    type: String,
    description: 'National id of the company creator',
    example: '1234567890',
  })
  @IsString()
  nationalId!: string

  @ApiProperty({
    type: String,
    description: 'Address of the company creator',
    example: 'Laugavegur 1, 101 Reykjavik',
  })
  @IsString()
  address!: string
}

export class RegisterCompanyDto {
  @ApiProperty({
    type: ResponsiblePartyDto,
    description: 'The party responsible for the company',
  })
  @IsDefined()
  @Type(() => ResponsiblePartyDto)
  @ValidateNested()
  responsibleParty!: ResponsiblePartyDto

  @ApiProperty({
    type: String,
    description: 'Name of the company',
    example: 'My company',
  })
  @IsString()
  name!: string

  @ApiProperty({
    type: String,
    description: 'National id of the company',
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
    type: [CompanyCreatorDto],
    description: 'List of company creators',
  })
  @IsDefined()
  @Type(() => CompanyCreatorDto)
  @ValidateNested({ each: true })
  creators!: CompanyCreatorDto[]

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
    type: CompanyBoardDto,
    description: 'The chairman of the board',
    required: false,
  })
  @IsOptional()
  @Type(() => CompanyBoardDto)
  @ValidateNested()
  boardMembers?: CompanyBoardDto

  @ApiProperty({
    type: CompanyChairmanDto,
    description: 'The chairman of the board',
    required: false,
  })
  @IsOptional()
  @Type(() => CompanyChairmanDto)
  @ValidateNested()
  chairmen?: CompanyChairmanDto

  @ApiProperty({
    type: [PartyEntityDto],
    description: 'The executive board of the company',
  })
  @IsArray()
  @Type(() => PartyEntityDto)
  @ValidateNested({ each: true })
  executiveBoard!: PartyEntityDto[]

  @ApiProperty({
    type: String,
    example:
      'Ef einn í stjórn:  Stjórnarmaður, ef stjórn er fjölskipuð: Meirihluti stjórnar',
  })
  @IsString()
  signingAuthority!: string

  @ApiProperty({
    type: [PartyEntityDto],
    description: 'The procuration holders of the company',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @Type(() => PartyEntityDto)
  @ValidateNested({ each: true })
  procurationHolders?: PartyEntityDto[]

  @ApiProperty({
    type: [PartyEntityDto],
    description: 'John Doe',
    example: 'Nafn endurskoðanda',
  })
  @IsDefined()
  @Type(() => PartyEntityDto)
  @ValidateNested()
  auditors!: [PartyEntityDto]

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
    type: Boolean,
    description: 'Lausnarskylda',
    example: false,
  })
  @IsBoolean()
  liquidationObligation!: boolean
}
