import { IsOptional, IsUUID } from 'class-validator'

import {
  ApiBoolean,
  ApiDto,
  ApiEnum,
  ApiNumber,
  ApiOptionalArray,
  ApiOptionalEnum,
  ApiOptionalString,
  ApiOptionalUuid,
  ApiString,
} from '@dmr.is/decorators'

export enum PublicationSearchQueryKind {
  Empty = 'empty',
  FreeText = 'free_text',
  PublicationNumber = 'publication_number',
}

export const PublicationSearchAdvertVersion = {
  A: 'A',
  B: 'B',
  C: 'C',
} as const

export type PublicationSearchAdvertVersion =
  (typeof PublicationSearchAdvertVersion)[keyof typeof PublicationSearchAdvertVersion]

export class PublicationSearchTrackingFiltersDto {
  @ApiOptionalUuid()
  advertId?: string

  @ApiOptionalString()
  dateFrom?: string

  @ApiOptionalString()
  dateTo?: string

  @ApiOptionalUuid()
  typeId?: string

  @ApiOptionalArray({ type: String })
  @IsUUID('4', { each: true })
  categoryId?: string[]

  @ApiOptionalEnum(PublicationSearchAdvertVersion, {
    enumName: 'PublicationSearchAdvertVersion',
  })
  version?: PublicationSearchAdvertVersion
}

export class PublicationSearchTrackingResultDto {
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

export class PublicationSearchTrackingEventDto {
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

  @ApiEnum(PublicationSearchQueryKind, {
    enumName: 'PublicationSearchQueryKind',
  })
  queryKind!: PublicationSearchQueryKind

  @ApiNumber()
  queryLength!: number

  @ApiNumber()
  queryTokenCount!: number

  @ApiBoolean()
  hasFilters!: boolean

  @ApiDto(PublicationSearchTrackingFiltersDto)
  filters!: PublicationSearchTrackingFiltersDto

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
