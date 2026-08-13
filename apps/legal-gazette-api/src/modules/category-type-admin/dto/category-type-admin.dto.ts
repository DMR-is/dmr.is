import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator'

import {
  ApiBoolean,
  ApiDtoArray,
  ApiEnum,
  ApiNumber,
  ApiOptionalArray,
  ApiOptionalEnum,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiOptionalUuid,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import {
  CategoryTypeChangeLogDto,
  ChangeLogEntity,
} from '../../../models/category-type-change-log.model'

/**
 * Slugs are public URL segments, so they are constrained to the same shape the
 * server would derive from a title. The service additionally normalises whatever
 * comes in through `slugify()`; this is the cheap guard that rejects nonsense
 * before it gets there.
 */
export const SLUG_PATTERN = /^[a-z0-9-]+$/
const SLUG_MESSAGE =
  'slug má aðeins innihalda lágstafi (a-z), tölustafi og bandstrik'
const SLUG_DESCRIPTION =
  'Lowercase letters, digits and hyphens only. Derived from the title when omitted.'

/** Who performed the action (resolved from the authenticated admin). */
export interface CategoryTypeActor {
  id: string
  name: string | null
}

export class CreateCategoryBody {
  @ApiString()
  @IsString()
  title!: string

  @ApiOptionalString({ description: SLUG_DESCRIPTION })
  @IsOptional()
  @IsString()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  slug?: string
}

export class UpdateCategoryBody {
  @ApiOptionalString()
  @IsOptional()
  @IsString()
  title?: string

  @ApiOptionalString({ description: SLUG_DESCRIPTION })
  @IsOptional()
  @IsString()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  slug?: string
}

export class CreateTypeBody {
  @ApiString()
  @IsString()
  title!: string

  @ApiOptionalString({ description: SLUG_DESCRIPTION })
  @IsOptional()
  @IsString()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  slug?: string

  @ApiOptionalArray({ type: String })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  categoryIds?: string[]
}

export class UpdateTypeBody {
  @ApiOptionalString()
  @IsOptional()
  @IsString()
  title?: string

  @ApiOptionalString({ description: SLUG_DESCRIPTION })
  @IsOptional()
  @IsString()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  slug?: string
}

export class SetActiveBody {
  @ApiBoolean()
  @IsBoolean()
  active!: boolean
}

export class ConnectionBody {
  @ApiUUId()
  @IsUUID()
  typeId!: string

  @ApiUUId()
  @IsUUID()
  categoryId!: string
}

/**
 * Re-points existing adverts. Adverts matching (fromTypeId [, fromCategoryId])
 * get their type and/or category reassigned to the provided target(s).
 */
export class MoveAdvertsBody {
  @ApiUUId()
  @IsUUID()
  fromTypeId!: string

  @ApiOptionalUuid()
  @IsOptional()
  @IsUUID()
  fromCategoryId?: string

  @ApiOptionalUuid()
  @IsOptional()
  @IsUUID()
  toTypeId?: string

  @ApiOptionalUuid()
  @IsOptional()
  @IsUUID()
  toCategoryId?: string
}

export class ImpactDto {
  @ApiNumber()
  affectedAdvertCount!: number

  @ApiOptionalArray({ type: String })
  sampleAdvertIds?: string[]
}

/**
 * Name for an id appearing in a log entry or its snapshots, so the client can
 * render „Skiptalok" instead of a UUID.
 */
export class ChangeLogTitleDto {
  @ApiUUId()
  id!: string

  @ApiString()
  title!: string

  @ApiEnum(ChangeLogEntity, { enumName: 'ChangeLogEntity' })
  entityType!: ChangeLogEntity
}

export class GetChangeLogDto {
  @ApiDtoArray(CategoryTypeChangeLogDto)
  entries!: CategoryTypeChangeLogDto[]

  @ApiNumber()
  total!: number

  /**
   * Titles of every category and type, deleted ones included — log entries
   * routinely reference entities that no longer exist.
   */
  @ApiDtoArray(ChangeLogTitleDto)
  titles!: ChangeLogTitleDto[]
}

export class ChangeLogQuery {
  @ApiOptionalEnum(ChangeLogEntity, { enumName: 'ChangeLogEntity' })
  @IsOptional()
  entityType?: ChangeLogEntity

  @ApiOptionalUuid()
  @IsOptional()
  @IsUUID()
  entityId?: string

  @ApiOptionalNumber()
  @IsOptional()
  limit?: number

  @ApiOptionalNumber()
  @IsOptional()
  offset?: number
}

// --- Admin overview (current state, incl. inactive rows + connections) ---

export class TypeOverviewDto {
  @ApiUUId()
  id!: string

  @ApiString()
  title!: string

  @ApiString()
  slug!: string

  @ApiBoolean()
  active!: boolean

  /** Adverts referencing this type, across every category. */
  @ApiNumber()
  advertCount!: number
}

export class CategoryOverviewDto {
  @ApiUUId()
  id!: string

  @ApiString()
  title!: string

  @ApiString()
  slug!: string

  @ApiBoolean()
  active!: boolean

  /** Adverts referencing this category, across every type. */
  @ApiNumber()
  advertCount!: number

  @ApiDtoArray(TypeOverviewDto)
  types!: TypeOverviewDto[]
}

export class CategoryTypeOverviewDto {
  @ApiDtoArray(CategoryOverviewDto)
  categories!: CategoryOverviewDto[]

  @ApiDtoArray(TypeOverviewDto)
  types!: TypeOverviewDto[]
}
