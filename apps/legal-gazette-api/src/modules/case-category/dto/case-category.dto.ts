import { IsEnum, IsOptional, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityDetailedDto, BaseEntityDto } from '@dmr.is/legal-gazette/dto'

import { CaseTypeSlugEnum } from '../../case-type/case-type.model'
import { CaseTypeDetailedDto } from '../../case-type/dto/case-type.dto'

export class GetCaseCategoriesQueryDto {
  @ApiProperty({
    enum: CaseTypeSlugEnum,
    enumName: 'CaseTypeSlugEnum',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsEnum(CaseTypeSlugEnum)
  type?: CaseTypeSlugEnum
}

export class CaseCategoryDto extends BaseEntityDto {}

export class CaseCategoryDetailedDto extends BaseEntityDetailedDto {
  @ApiProperty({
    type: String,
  })
  @IsUUID()
  typeId!: string

  @ApiProperty({
    type: CaseTypeDetailedDto,
  })
  type!: CaseTypeDetailedDto
}

export class GetCaseCategoriesDto {
  @ApiProperty({
    type: [CaseCategoryDto],
  })
  categories!: CaseCategoryDto[]
}

export class GetCaseCategoriesDetailedDto {
  @ApiProperty({
    type: [CaseCategoryDetailedDto],
  })
  categories!: CaseCategoryDetailedDto[]
}
