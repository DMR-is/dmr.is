import { IsUUID } from 'class-validator'

import {
  ApiDtoArray,
  ApiOptionalArray,
  ApiOptionalBoolean,
  ApiOptionalUUID,
} from '@dmr.is/decorators'

import { CategoryDto } from '../../../models/category.model'
import { CourtDistrictDto } from '../../../models/court-district.model'
import { StatusDto } from '../../../models/status.model'
import { TypeDto } from '../../../models/type.model'

export class GetCategoriesQueryDto {
  @ApiOptionalUUID()
  type?: string

  @ApiOptionalBoolean()
  excludeUnassignable?: boolean
}

export class GetCategoriesDto {
  @ApiDtoArray(CategoryDto)
  categories!: CategoryDto[]
}

export class GetTypesDto {
  @ApiDtoArray(TypeDto)
  types!: TypeDto[]
}

export class GetTypesQueryDto {
  @ApiOptionalUUID()
  category?: string

  @ApiOptionalArray({ type: String })
  @IsUUID(undefined, { each: true })
  excludeTypes?: string[]

  @ApiOptionalBoolean()
  excludeUnassignable?: boolean
}

export class GetStatusesDto {
  @ApiDtoArray(StatusDto)
  statuses!: StatusDto[]
}

export class GetCourtDistrictsDto {
  @ApiDtoArray(CourtDistrictDto)
  courtDistricts!: CourtDistrictDto[]
}
