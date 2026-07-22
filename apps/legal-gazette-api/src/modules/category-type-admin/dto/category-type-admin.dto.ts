import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'

import {
  ApiBoolean,
  ApiDtoArray,
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

/** Who performed the action (resolved from the authenticated admin). */
export interface CategoryTypeActor {
  id: string
  name: string | null
}

export class CreateCategoryBody {
  @ApiString()
  @IsString()
  title!: string

  @ApiOptionalString()
  @IsOptional()
  @IsString()
  slug?: string
}

export class UpdateCategoryBody {
  @ApiOptionalString()
  @IsOptional()
  @IsString()
  title?: string

  @ApiOptionalString()
  @IsOptional()
  @IsString()
  slug?: string
}

export class CreateTypeBody {
  @ApiString()
  @IsString()
  title!: string

  @ApiOptionalString()
  @IsOptional()
  @IsString()
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

  @ApiOptionalString()
  @IsOptional()
  @IsString()
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

export class GetChangeLogDto {
  @ApiDtoArray(CategoryTypeChangeLogDto)
  entries!: CategoryTypeChangeLogDto[]

  @ApiNumber()
  total!: number
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
