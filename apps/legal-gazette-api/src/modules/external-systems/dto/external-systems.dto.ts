import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

import { ApiProperty, PickType } from '@nestjs/swagger'

import { ApiDateTime } from '@dmr.is/decorators'

import { CreateSignatureDto } from '../../advert/signature/dto/signature.dto'

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

export class ResponsiblePartySignature extends CreateSignatureDto {}

export class ObjectIssuer {
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

  @ApiProperty({ type: ResponsiblePartySignature })
  @IsDefined()
  @Type(() => ResponsiblePartySignature)
  @ValidateNested()
  signature!: ResponsiblePartySignature

  @ApiProperty({
    type: String,
    description: 'External id if external service sent the advert',
    required: false,
  })
  @IsOptional()
  @IsString()
  externalId?: string
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

  @ApiProperty({
    type: String,
    description: 'Role of the party, always comes first if present',
    example: 'Stjórnarmaður, meðstjórnandi o.s.frv.',
    required: false,
  })
  @IsOptional()
  @IsString()
  role?: string

  @ApiProperty({
    type: String,
    description: 'Job title of the party, always comes last if present',
    example: 'löggiltur endurskoðandi',
    required: false,
  })
  @IsOptional()
  @IsString()
  jobTitle?: string
}

export class AdditionalPropertiesDto {
  @ApiProperty({
    type: String,
    description: 'The key of the addtional information',
    example: 'Stjórn / Stjórnarformaður og framkvæmdastjórn',
  })
  @IsString()
  key!: string

  @ApiProperty({
    type: PartyEntityDto,
    description: 'The value of the addtional information',
  })
  @IsDefined()
  @Type(() => PartyEntityDto)
  @ValidateNested()
  value!: PartyEntityDto
}

export class CompanyBoardDto {
  @ApiDateTime({
    description: 'The date when the board was appointed',
    example: '2023-10-01T12:00:00Z (ISO 8601 format)',
  })
  appointedDate!: Date

  @ApiProperty({
    type: [PartyEntityDto],
    description: 'The members of the company board (Stjórn)',
  })
  @IsDefined()
  @IsArray()
  @Type(() => PartyEntityDto)
  @ValidateNested({ each: true })
  members!: PartyEntityDto[]

  @ApiProperty({
    type: [PartyEntityDto],
    description:
      'The executive members of the company board (Framkvæmdarstjórn)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @Type(() => PartyEntityDto)
  @ValidateNested({ each: true })
  executiveBoardMembers?: PartyEntityDto[]
}

export class RegisterCompanyHlutafelagDto {
  @ApiProperty({
    type: ObjectIssuer,
    description: 'The party responsible for the company',
  })
  @IsDefined()
  @Type(() => ObjectIssuer)
  @ValidateNested()
  responsibleParty!: ObjectIssuer

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

  @ApiDateTime({
    description: 'Date when the company was accepted (Dagsetning samþykkta er)',
    example: '2023-10-01T12:00:00Z (ISO 8601 format)',
  })
  approvedDate!: Date

  @ApiProperty({
    type: CompanyBoardDto,
    description: 'The board of the company (Stjórn)',
  })
  @IsDefined()
  @Type(() => CompanyBoardDto)
  @ValidateNested()
  board!: CompanyBoardDto

  @ApiProperty({
    type: String,
    example:
      'Ef einn í stjórn:  Stjórnarmaður, ef stjórn er fjölskipuð: Meirihluti stjórnar (Firmað ritar)',
  })
  @IsString()
  signature!: string

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
    type: String,
    isArray: true,
    description: 'List of additional announcements to create (Tegundir)',
    example: ['A', 'J'],
  })
  @IsArray()
  @IsString({ each: true })
  announcementItems!: string[]
}

export class CreateAdditionalAnnouncementsDto {
  @ApiProperty({
    type: ObjectIssuer,
    description: 'The party responsible for the additional announcements',
  })
  @IsDefined()
  @Type(() => ObjectIssuer)
  @ValidateNested()
  responsibleParty!: ObjectIssuer

  @ApiDateTime()
  announcementDate!: Date

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

export class RegisterCompanyFirmaskraDto extends PickType(
  RegisterCompanyHlutafelagDto,
  [
    'responsibleParty',
    'name',
    'nationalId',
    'approvedDate',
    'registeredAddress',
    'creators',
    'purpose',
    'procurationHolders',
  ] as const,
) {
  @ApiProperty({
    type: String,
    description: 'Tax membership status (Skattaðlid)',
    example: 'félagið er sjálfstæður skattaðili',
  })
  @IsString()
  taxMembership!: string

  @ApiProperty({
    type: String,
    description: 'Firmaritun',
    example: 'Allir félagsmenn saman',
  })
  @IsString()
  firmWriting!: string

  @ApiProperty({
    type: [AdditionalPropertiesDto],
    description:
      'Additional properties (Auka eigindi, birtast neðst í auglýsingu)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @Type(() => AdditionalPropertiesDto)
  @ValidateNested({ each: true })
  additionalProperties?: AdditionalPropertiesDto[]
}
