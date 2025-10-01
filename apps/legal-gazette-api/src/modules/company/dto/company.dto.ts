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

import { ApiProperty, PickType } from '@nestjs/swagger'

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
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'The date when the board was appointed',
    example: '2023-10-01T12:00:00Z (ISO 8601 format)',
  })
  @IsDateString()
  appointedDate!: string

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
  theFirmWrites!: string

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
