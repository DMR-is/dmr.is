import { IsOptional, IsString } from 'class-validator'

import {
  ApiBoolean,
  ApiDto,
  ApiEnum,
  ApiNumber,
  ApiOptionalArray,
  ApiOptionalString,
  ApiString,
} from '@dmr.is/decorators'

export enum LeanSearchQueryKind {
  Empty = 'empty',
  FreeText = 'free_text',
  PrefixWildcard = 'prefix_wildcard',
  PublicationNumber = 'publication_number',
  InternalCaseNumber = 'internal_case_number',
}

export class LeanSearchTrackingFiltersDto {
  @ApiOptionalArray({ type: String })
  @IsString({ each: true })
  department?: string[]

  @ApiOptionalArray({ type: String })
  @IsString({ each: true })
  type?: string[]

  @ApiOptionalArray({ type: String })
  @IsString({ each: true })
  mainType?: string[]

  @ApiOptionalArray({ type: String })
  @IsString({ each: true })
  category?: string[]

  @ApiOptionalArray({ type: String })
  @IsString({ each: true })
  involvedParty?: string[]

  @ApiOptionalString()
  year?: string

  @ApiOptionalString()
  dateFrom?: string

  @ApiOptionalString()
  dateTo?: string
}

export class LeanSearchTrackingResultDto {
  @ApiNumber()
  page!: number

  @ApiNumber()
  pageSize!: number

  @ApiNumber()
  pageResultCount!: number

  @ApiNumber()
  totalResultCount!: number

  @ApiNumber()
  durationMs!: number
}

export class LeanSearchTrackingEventDto {
  @ApiString()
  route!: string

  @ApiString()
  backend!: string

  @ApiOptionalString({ nullable: true })
  @IsOptional()
  normalizedQuery!: string | null

  @ApiOptionalString({ nullable: true })
  @IsOptional()
  queryHash!: string | null

  @ApiEnum(LeanSearchQueryKind, { enumName: 'LeanSearchQueryKind' })
  queryKind!: LeanSearchQueryKind

  @ApiNumber()
  queryLength!: number

  @ApiNumber()
  queryTokenCount!: number

  @ApiBoolean()
  hasFilters!: boolean

  @ApiDto(LeanSearchTrackingFiltersDto)
  filters!: LeanSearchTrackingFiltersDto

  @ApiNumber()
  page!: number

  @ApiNumber()
  pageSize!: number

  @ApiOptionalString({ nullable: true })
  @IsOptional()
  sortBy!: string | null

  @ApiOptionalString({ nullable: true })
  @IsOptional()
  direction!: string | null

  @ApiNumber()
  pageResultCount!: number

  @ApiNumber()
  totalResultCount!: number

  @ApiNumber()
  durationMs!: number
}
