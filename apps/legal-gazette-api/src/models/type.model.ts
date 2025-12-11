import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional, IsUUID } from 'class-validator'
import { BelongsToMany } from 'sequelize-typescript'

import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
import { BaseEntityDto } from '../modules/base-entity/base-entity.dto'
import { AdvertTypeFeeCodeModel } from './advert-type-fee-code.model'
import { CategoryModel } from './category.model'
import { FeeCodeModel } from './fee-code.model'
import {
  TypeCategoriesModel,
  TypeWithCategoriesDto,
} from './type-categories.model'

export enum TypeIdEnum {
  RECALL_BANKRUPTCY = '065C3FD9-58D1-436F-9FB8-C1F5C214FA50',
  RECALL_DECEASED = 'BC6384F4-91B0-48FE-9A3A-B528B0AA6468',
  DIVISION_MEETING = 'F1A7CE20-37BE-451B-8AA7-BC90B8A7E7BD',
  DIVISION_ENDING = 'D40BED80-6D9C-4388-AEA8-445B27614D8A',
  FORECLOSURE = '6BD9C89E-8658-4EA0-A1CE-1948656EB4E7',
}

@BaseEntityTable({
  tableName: LegalGazetteModels.ADVERT_TYPE,
})
export class TypeModel extends BaseEntityModel<TypeDto> {
  @BelongsToMany(() => CategoryModel, { through: () => TypeCategoriesModel })
  categories!: CategoryModel[]

  // This is always a array with one element, we need to use BelongsToMany to get the join table
  @BelongsToMany(() => FeeCodeModel, { through: () => AdvertTypeFeeCodeModel })
  feeCode?: FeeCodeModel[]

  static fromModelWithCategories(model: TypeModel): TypeWithCategoriesDto {
    return {
      id: model.id,
      title: model.title,
      slug: model.slug,
      categories: model?.categories?.map((category) => category.fromModel()),
    }
  }

  fromModelWithCategories(): TypeWithCategoriesDto {
    return TypeModel.fromModelWithCategories(this)
  }
}

export class TypeDto extends BaseEntityDto {}

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
