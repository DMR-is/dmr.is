import { ApiProperty } from '@nestjs/swagger'
import {
  IsBoolean,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
  IsPositive,
  IsNotEmpty,
} from 'class-validator'
import { Type } from 'class-transformer'

export class DeregistrationDto {
  @ApiProperty({ description: 'Whether the entity is deregistered' })
  @IsBoolean()
  deregistered!: boolean

  @ApiProperty({ description: 'Date of deregistration', required: false })
  @IsOptional()
  @IsDateString()
  deregistrationDate?: string

  @ApiProperty({ description: 'Whether the entity is in bankruptcy' })
  @IsBoolean()
  bankrupcy!: boolean

  @ApiProperty({ description: 'Date of bankruptcy', required: false })
  @IsOptional()
  @IsDateString()
  bankrupcyDate?: string

  @ApiProperty({ description: 'Whether the entity is insolvent' })
  @IsBoolean()
  insolvency!: boolean

  @ApiProperty({ description: 'Date of insolvency', required: false })
  @IsOptional()
  @IsDateString()
  insolvencyDate?: string
}

export class LegalFormDto {
  @ApiProperty({ description: 'Legal form identifier' })
  @IsString()
  @IsNotEmpty()
  id!: string

  @ApiProperty({ description: 'Legal form name' })
  @IsString()
  @IsNotEmpty()
  name!: string
}

export class ArticlesOfAssociationDto {
  @ApiProperty({ description: 'Share capital amount' })
  @IsNumber()
  @IsPositive()
  shareCapital!: number

  @ApiProperty({ description: 'Share group classification' })
  @IsString()
  @IsNotEmpty()
  shareGroup!: string

  @ApiProperty({ description: 'Currency of share capital' })
  @IsString()
  @IsNotEmpty()
  shareCapitalCurrency!: string

  @ApiProperty({ description: 'Signature requirements' })
  @IsString()
  @IsNotEmpty()
  signatures!: string

  @ApiProperty({ description: 'Voting rights description' })
  @IsString()
  @IsNotEmpty()
  votingRights!: string

  @ApiProperty({
    description: 'Whether there are restrictions on handling of shares',
  })
  @IsBoolean()
  restrictionHandlingOfShares!: boolean

  @ApiProperty({
    description: 'Whether there is liability for redemption of shares',
  })
  @IsBoolean()
  liabilityForRedemptionOfShares!: boolean

  @ApiProperty({ description: 'Whether there are special rights' })
  @IsBoolean()
  specialRights!: boolean

  @ApiProperty({ description: 'Last updated timestamp' })
  @IsString()
  @IsNotEmpty()
  lastUpdated!: string
}

export class ActivityCodeTypeDto {
  @ApiProperty({ description: 'Activity code type name' })
  @IsString()
  @IsNotEmpty()
  name!: string
}

export class ActivityCodeDto {
  @ApiProperty({ type: ActivityCodeTypeDto, description: 'Activity code type' })
  @ValidateNested()
  @Type(() => ActivityCodeTypeDto)
  type!: ActivityCodeTypeDto

  @ApiProperty({ description: 'Code system identifier' })
  @IsString()
  @IsNotEmpty()
  codeSystem!: string

  @ApiProperty({ description: 'Activity code identifier' })
  @IsString()
  @IsNotEmpty()
  id!: string

  @ApiProperty({ description: 'Activity code name' })
  @IsString()
  @IsNotEmpty()
  name!: string
}

export class VatDto {
  @ApiProperty({ description: 'VAT registration number' })
  @IsString()
  @IsNotEmpty()
  vatNumber!: string

  @ApiProperty({ description: 'VAT registration date' })
  @IsDateString()
  registered!: string

  @ApiProperty({ description: 'VAT deregistration date', required: false })
  @IsOptional()
  @IsDateString()
  deRegistered?: string

  @ApiProperty({ type: ActivityCodeDto, description: 'VAT activity code' })
  @ValidateNested()
  @Type(() => ActivityCodeDto)
  activityCode!: ActivityCodeDto
}

export class AddressTypeDto {
  @ApiProperty({ description: 'Address type name' })
  @IsString()
  @IsNotEmpty()
  name!: string
}

export class AddressDto {
  @ApiProperty({ type: AddressTypeDto, description: 'Address type' })
  @ValidateNested()
  @Type(() => AddressTypeDto)
  type!: AddressTypeDto

  @ApiProperty({ description: 'Street address' })
  @IsString()
  @IsNotEmpty()
  addressName!: string

  @ApiProperty({ description: 'Attention/care of', required: false })
  @IsOptional()
  @IsString()
  attention?: string

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  @IsNotEmpty()
  postcode!: string

  @ApiProperty({ description: 'City name' })
  @IsString()
  @IsNotEmpty()
  city!: string

  @ApiProperty({ description: 'Whether this is a post office box' })
  @IsBoolean()
  isPostbox!: boolean

  @ApiProperty({ description: 'Country name' })
  @IsString()
  @IsNotEmpty()
  country!: string

  @ApiProperty({ description: 'Municipality identifier', required: false })
  @IsOptional()
  @IsString()
  municipalityId?: string

  @ApiProperty({ description: 'Municipality name', required: false })
  @IsOptional()
  @IsString()
  municipality?: string
}

export class RelationshipDto {
  @ApiProperty({ description: 'Relationship type' })
  @IsString()
  @IsNotEmpty()
  type!: string

  @ApiProperty({ description: 'Position/role in the relationship' })
  @IsString()
  @IsNotEmpty()
  position!: string

  @ApiProperty({ description: 'National ID of the related entity' })
  @IsString()
  @IsNotEmpty()
  nationalId!: string

  @ApiProperty({ description: 'Name of the related entity' })
  @IsString()
  @IsNotEmpty()
  name!: string

  @ApiProperty({
    type: AddressDto,
    description: 'Address of the related entity',
  })
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto
}

export class LinkDto {
  @ApiProperty({ description: 'Link relationship type' })
  @IsString()
  @IsNotEmpty()
  rel!: string

  @ApiProperty({ description: 'Link URL' })
  @IsString()
  @IsNotEmpty()
  href!: string
}

export class LegalEntityDto {
  @ApiProperty({ description: 'National ID of the legal entity' })
  @IsString()
  @IsNotEmpty()
  nationalId!: string

  @ApiProperty({ description: 'Primary name of the entity' })
  @IsString()
  @IsNotEmpty()
  name!: string

  @ApiProperty({
    description: 'Additional name or trading name',
    required: false,
  })
  @IsOptional()
  @IsString()
  additionalName?: string

  @ApiProperty({ description: 'Purpose of the entity' })
  @IsString()
  @IsNotEmpty()
  purposeOfEntity!: string

  @ApiProperty({ description: 'Initial capital amount' })
  @IsNumber()
  @IsPositive()
  initialCapital!: number

  @ApiProperty({ description: 'Accounting year period' })
  @IsString()
  @IsNotEmpty()
  accountingYear!: string

  @ApiProperty({ description: 'Date of bylaws', required: false })
  @IsOptional()
  @IsDateString()
  dateOfBylaws?: string

  @ApiProperty({ description: 'Date of agreements', required: false })
  @IsOptional()
  @IsDateString()
  dateOfAgreements?: string

  @ApiProperty({ description: 'Date of board change', required: false })
  @IsOptional()
  @IsDateString()
  dateOfBoardChange?: string

  @ApiProperty({ description: 'Registration date' })
  @IsDateString()
  registered!: string

  @ApiProperty({ description: 'Current status of the entity' })
  @IsString()
  @IsNotEmpty()
  status!: string

  @ApiProperty({
    type: DeregistrationDto,
    description: 'Deregistration information',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeregistrationDto)
  deregistration?: DeregistrationDto

  @ApiProperty({ type: LegalFormDto, description: 'Legal form information' })
  @ValidateNested()
  @Type(() => LegalFormDto)
  legalForm!: LegalFormDto

  @ApiProperty({ description: 'Registry comment', required: false })
  @IsOptional()
  @IsString()
  registryComment?: string

  @ApiProperty({
    type: ArticlesOfAssociationDto,
    description: 'Articles of association',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ArticlesOfAssociationDto)
  articlesOfAssociation?: ArticlesOfAssociationDto

  @ApiProperty({
    type: [ActivityCodeDto],
    description: 'Activity codes',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityCodeDto)
  activityCode!: ActivityCodeDto[]

  @ApiProperty({
    type: [VatDto],
    description: 'VAT registrations',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VatDto)
  vat!: VatDto[]

  @ApiProperty({ type: [AddressDto], description: 'Addresses' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  address!: AddressDto[]

  @ApiProperty({
    type: [RelationshipDto],
    description: 'Related entities and relationships',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RelationshipDto)
  relationships!: RelationshipDto[]

  @ApiProperty({ type: [LinkDto], description: 'Related links' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkDto)
  links!: LinkDto[]

  @ApiProperty({ description: 'Last updated timestamp' })
  @IsString()
  @IsNotEmpty()
  lastUpdated!: string
}

export class GetCompanyDto {
  @ApiProperty({ type: LegalEntityDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => LegalEntityDto)
  legalEntity!: LegalEntityDto | null
}
