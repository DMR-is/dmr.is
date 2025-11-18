import { IsOptional, IsUUID } from 'class-validator'
import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  PrimaryKey,
} from 'sequelize-typescript'

import { ApiProperty } from '@nestjs/swagger'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { BaseEntityDto } from '../dto/base-entity.dto'
import { LegalGazetteModels } from '../lib/constants'
import { CategoryDto, CategoryModel } from './category.model'
import { TypeDto, TypeModel } from './type.model'

type TypeCategoriesAttributes = {
  typeId: string
  categoryId: string
  type: TypeModel
  category: CategoryModel
}

export type TypeCategoriesCreateAttributes = TypeCategoriesAttributes

@DefaultScope(() => ({
  include: [
    {
      model: TypeModel,
      as: 'type',
    },
    {
      model: CategoryModel,
      as: 'category',
    },
  ],
}))
@BaseTable({ tableName: LegalGazetteModels.TYPE_CATEGORIES })
export class TypeCategoriesModel extends BaseModel<
  TypeCategoriesAttributes,
  TypeCategoriesCreateAttributes
> {
  @PrimaryKey
  @ForeignKey(() => TypeModel)
  @Column({ type: DataType.UUID, allowNull: false })
  @ApiProperty({ type: String })
  typeId!: string

  @PrimaryKey
  @ForeignKey(() => CategoryModel)
  @Column({ type: DataType.UUID, allowNull: false })
  @ApiProperty({ type: String })
  categoryId!: string

  @BelongsTo(() => TypeModel)
  type!: TypeModel

  @BelongsTo(() => CategoryModel)
  category!: CategoryModel

  static fromModel(model: TypeCategoriesModel): TypeCategoryDto {
    return {
      type: model.type.fromModel(),
      category: model.category.fromModel(),
    }
  }

  fromModel(): TypeCategoryDto {
    return TypeCategoriesModel.fromModel(this)
  }
}

export class TypeCategoryDto {
  @ApiProperty({ type: TypeDto })
  type!: TypeDto
  @ApiProperty({ type: CategoryDto })
  category!: CategoryDto
}

export class TypeWithCategoriesQueryDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  typeId?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string
}

export class TypeWithCategoriesDto extends BaseEntityDto {
  @ApiProperty({ type: [CategoryDto] })
  categories!: CategoryDto[]
}

export class TypeWithCategoriesResponseDto {
  @ApiProperty({ type: TypeWithCategoriesDto })
  type!: TypeWithCategoriesDto
}

export class TypesWithCategoriesResponseDto {
  @ApiProperty({ type: [TypeWithCategoriesDto] })
  types!: TypeWithCategoriesDto[]
}
