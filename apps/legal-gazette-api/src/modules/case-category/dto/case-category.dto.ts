import { IsEnum, IsOptional, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { LegalGazetteApplicationTypes } from '@dmr.is/legal-gazette/constants'
import { BaseEntityDetailedDto, BaseEntityDto } from '@dmr.is/legal-gazette/dto'

import { CaseTypeDetailedDto } from '../../case-type/dto/case-type.dto'

export class GetCaseCategoriesQueryDto {
  @ApiProperty({
    enum: LegalGazetteApplicationTypes,
    enumName: 'ApplicationType',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsEnum(LegalGazetteApplicationTypes)
  type?: LegalGazetteApplicationTypes
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
