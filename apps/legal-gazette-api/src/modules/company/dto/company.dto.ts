import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export enum AnnouncementItem {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
  H = 'H',
  J = 'J',
  K = 'K',
  L = 'L',
  M = 'M',
  N = 'N',
  O = 'O',
  P = 'P',
  R = 'R',
  S = 'S',
  T = 'T',
}

export class ResponsiblePartyDto {
  @ApiProperty({
    type: String,
    description: 'Name of the party responsible for the advert',
    example: 'Ríkisskattstjóri, hlutafélagaskrá',
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
    description: 'The name of the institution signing the advert',
    example: 'Ríkisskattstjóri, hlutafélagaskrá',
  })
  @IsString()
  signatureName!: string

  @ApiProperty({
    type: String,
    description: 'Where the signature took place',
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
    example: 'Jón Jónsson / Jón ehf.',
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
    description: 'The chairman (formaður) of the company',
  })
  @IsDefined()
  @Type(() => PartyEntityDto)
  @ValidateNested()
  chairman!: PartyEntityDto

  @ApiProperty({
    type: PartyEntityDto,
    description: 'The vice chairman (meðstjórnandi) of the company',
    required: false,
  })
  @IsOptional()
  @Type(() => PartyEntityDto)
  @ValidateNested()
  viceChairman?: PartyEntityDto

  @ApiProperty({
    type: [PartyEntityDto],
    description: 'The reserve chairmen (varastjórn) of the company',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @Type(() => PartyEntityDto)
  @ValidateNested({ each: true })
  reserveChairmen?: PartyEntityDto[]
}

export class CompanyAdministrationDto {
  @ApiProperty({
    type: PartyEntityDto,
    description: 'The vice administrator of the company (Stjórnarmaður)',
  })
  @IsDefined()
  @Type(() => PartyEntityDto)
  @ValidateNested()
  administrator!: PartyEntityDto

  @ApiProperty({
    type: [PartyEntityDto],
    description: 'The vice administation of the company (Varastjórn)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @Type(() => PartyEntityDto)
  @ValidateNested()
  viceAdministration?: PartyEntityDto[]
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
    description: 'Name of the registered company (Félagið heitir)',
    example: 'HXM ehf.',
  })
  @IsString()
  name!: string

  @ApiProperty({
    type: String,
    description: 'National id of the registered company (Kennitala fyrirtækis)',
    example: '1234567890',
  })
  @IsString()
  nationalId!: string

  @ApiProperty({
    type: String,
    description:
      'Address of the registered company (Skráð heimilisfang fyrirtækis)',
    example: 'Laugavegur 1, 101 Reykjavik',
  })
  @IsString()
  registeredAddress!: string

  @ApiProperty({
    type: [PartyEntityDto],
    description: 'List of registered company creators (Stofnendur)',
  })
  @IsDefined()
  @Type(() => PartyEntityDto)
  @ValidateNested({ each: true })
  creators!: PartyEntityDto[]

  @ApiProperty({
    type: String,
    description: 'Date when the company was accepted (Dagsetning samþykkta er)',
    example: '2023-10-01T12:00:00Z (ISO 8601 format)',
  })
  @IsDateString()
  approvedDate!: string

  @ApiProperty({
    type: String,
    description:
      'Date when the board was established (Stjórn félagsins skipa skv. fundi dags)',
    example: '2023-10-01T12:00:00Z (ISO 8601 format)',
  })
  @IsDateString()
  boardAppointed!: string

  @ApiProperty({
    type: CompanyAdministrationDto,
    description: 'The administration of the company (Stjórnarmaður)',
    required: false,
  })
  @IsOptional()
  @Type(() => CompanyAdministrationDto)
  @ValidateNested()
  administration?: CompanyAdministrationDto

  @ApiProperty({
    type: CompanyChairmanDto,
    description: 'The chairman of the company board (Formaðurs stjórnar)',
    required: false,
  })
  @IsOptional()
  @Type(() => CompanyChairmanDto)
  @ValidateNested()
  chairmen?: CompanyChairmanDto

  @ApiProperty({
    type: [PartyEntityDto],
    description: 'The executive board of the company (Framkvæmdastjórn)',
  })
  @IsArray()
  @Type(() => PartyEntityDto)
  @ValidateNested({ each: true })
  executiveBoard!: PartyEntityDto[]

  @ApiProperty({
    type: String,
    example:
      'Ef einn í stjórn:  Stjórnarmaður, ef stjórn er fjölskipuð: Meirihluti stjórnar (Firmað ritar)',
  })
  @IsString()
  signingAuthority!: string

  @ApiProperty({
    type: [PartyEntityDto],
    description: 'The procuration holders of the company (Prókuruumboð)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @Type(() => PartyEntityDto)
  @ValidateNested({ each: true })
  procurationHolders?: PartyEntityDto[]

  @ApiProperty({
    type: [PartyEntityDto],
    description: 'The auditors of the company (Skoðunarmaður/endurskoðandi)',
  })
  @IsDefined()
  @Type(() => PartyEntityDto)
  @ValidateNested()
  auditors!: [PartyEntityDto]

  @ApiProperty({
    type: Number,
    description: 'The capital of the company in ISK (Hlutafé kr.)',
    example: 1000000,
  })
  @IsNumber()
  capital!: number

  @ApiProperty({
    type: String,
    description: 'The purpose of the company (Tilgangur)',
  })
  @IsString()
  purpose!: string

  @ApiProperty({
    type: Boolean,
    description: 'Are there special benefits (Hömlur á meðferð hlutabréfa)',
    example: false,
  })
  @IsBoolean()
  benefits!: boolean

  @ApiProperty({
    type: Boolean,
    description:
      'Is there an obligation for liquidation (Lausnarskylda á hlutabréfum)',
    example: false,
  })
  @IsBoolean()
  liquidationObligation!: boolean
}

export class AdditionalAnnouncementsDto {
  @ApiProperty({
    type: String,
    description: 'The national id of the company (Kennitala fyrirtækis)',
    example: '1234567890',
  })
  @IsString()
  companyNationalId!: string

  @ApiProperty({
    type: String,
    description: 'The name of the company (Heiti fyrirtækis)',
    example: 'HXM ehf.',
  })
  @IsString()
  companyName!: string

  @ApiProperty({
    type: String,
    description: 'The location of the company (Staðsetning fyrirtækis)',
    example: 'Reykjavík',
  })
  @IsString()
  companyLocation!: string

  @ApiProperty({
    enum: [AnnouncementItem],
    enumName: 'AnnouncementItem',
    description: 'List of additional announcements to create (Tegundir)',
    example: ['A', 'J'],
  })
  @IsArray()
  @IsEnum(AnnouncementItem, { each: true })
  announcementItems!: AnnouncementItem[]
}

export class CreateAdditionalAnnouncementsDto {
  @ApiProperty({
    type: ResponsiblePartyDto,
    description: 'The party responsible for the additional announcements',
  })
  @IsDefined()
  @Type(() => ResponsiblePartyDto)
  @ValidateNested()
  responsibleParty!: ResponsiblePartyDto

  @ApiProperty({
    type: Number,
    description:
      'The year of the additional announcements to create (1900 - 2100)',
    example: 2024,
  })
  @IsNumber()
  @Min(1900)
  @Max(2100)
  announcementYear!: number

  @ApiProperty({
    type: Number,
    description: 'The month of the additional announcements to create (0 - 11)',
    example: 6,
  })
  @IsNumber()
  @Min(0)
  @Max(11)
  announcementMonth!: number

  @ApiProperty({
    type: [AdditionalAnnouncementsDto],
    description:
      'List of additional announcements to create (Fjöldi tilkynninga)',
  })
  @IsDefined()
  @IsArray()
  @Type(() => AdditionalAnnouncementsDto)
  @ValidateNested({ each: true })
  announcements!: AdditionalAnnouncementsDto[]
}
