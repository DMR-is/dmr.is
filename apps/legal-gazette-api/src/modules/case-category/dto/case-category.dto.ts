import { IsEnum, IsOptional, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { LegalGazetteApplicationTypes } from '@dmr.is/legal-gazette/constants'
import { BaseEntityDetailedDto, BaseEntityDto } from '@dmr.is/legal-gazette/dto'

import {
  CaseTypeDetailedDto,
  CaseTypeDto,
} from '../../case-type/dto/case-type.dto'

export class GetCategoriesQueryDto {
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

export class CategoryDto extends BaseEntityDto {
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

export class CategoryDetailedDto extends BaseEntityDetailedDto {
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

export class GetCategoriesDto {
  @ApiProperty({
    type: [CategoryDto],
  })
  categories!: CategoryDto[]
}

export class GetCategoriesDetailedDto {
  @ApiProperty({
    type: [CategoryDetailedDto],
  })
  categories!: CategoryDetailedDto[]
}
