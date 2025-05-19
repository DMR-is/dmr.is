import { IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityDetailedDto, BaseEntityDto } from '@dmr.is/legal-gazette/dto'

import {
  CaseTypeDetailedDto,
  CaseTypeDto,
} from '../../case-type/dto/case-type.dto'

export class CaseCategoryDto extends BaseEntityDto {
  @ApiProperty({
    type: String,
  })
  @IsUUID()
  typeId!: string

  @ApiProperty({
    type: CaseTypeDto,
  })
  type!: CaseTypeDto
}

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
