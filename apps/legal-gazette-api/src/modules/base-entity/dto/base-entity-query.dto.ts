import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CategoryDto } from '../../../models/category.model'
import { CourtDistrictDto } from '../../../models/court-district.model'
import { StatusDto } from '../../../models/status.model'
import { TypeDto } from '../../../models/type.model'

export class GetCategoriesQueryDto {
  @ApiProperty({
    type: String,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  type?: string

  @ApiProperty({
    type: Boolean,
    required: false,
    description: 'Filter out unassignable advert types',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  excludeUnassignable?: boolean
}

export class GetCategoriesDto {
  @ApiProperty({
    type: [CategoryDto],
  })
  categories!: CategoryDto[]
}

export class GetTypesDto {
  @ApiProperty({ type: [TypeDto] })
  types!: TypeDto[]
}

export class GetTypesQueryDto {
  @ApiProperty({
    type: String,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  category?: string

  @ApiProperty({
    type: Boolean,
    required: false,
    description: 'Filter out unassignable advert types',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  excludeUnassignable?: boolean
}

export class GetStatusesDto {
  @ApiProperty({
    type: [StatusDto],
  })
  statuses!: StatusDto[]
}

export class GetCourtDistrictsDto {
  @ApiProperty({
    type: [CourtDistrictDto],
  })
  courtDistricts!: CourtDistrictDto[]
}
