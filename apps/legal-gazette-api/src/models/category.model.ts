import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional, IsUUID } from 'class-validator'
import { BelongsToMany } from 'sequelize-typescript'

import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { BaseEntityDto } from '../dto/base-entity.dto'
import { LegalGazetteModels } from '../lib/constants'
import { TypeModel } from './type.model'
import { TypeCategoriesModel } from './type-categories.model'

export enum CategoryDefaultIdEnum {
  RECALLS = '7D0E4B20-2FDD-4CA9-895B-9E7792ECA6E5',
  DIVISION_MEETINGS = 'C60E266F-E3F4-4B54-B1AE-565AA30962C4',
  DIVISION_ENDINGS = 'E99EC08C-7467-4B4F-8E72-1496CA61C9CC',
  FORECLOSURES = '3B372DD8-EDE5-4231-8616-6CB413BF8E2D',
}

@BaseEntityTable({
  tableName: LegalGazetteModels.ADVERT_CATEGORY,
})
export class CategoryModel extends BaseEntityModel<CategoryDto> {
  @BelongsToMany(() => TypeModel, { through: () => TypeCategoriesModel })
  types!: TypeModel[]
}

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

export class CategoryDto extends BaseEntityDto {}

export class GetCategoriesDto {
  @ApiProperty({
    type: [CategoryDto],
  })
  categories!: CategoryDto[]
}
