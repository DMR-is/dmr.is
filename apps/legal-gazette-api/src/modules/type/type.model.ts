import { BelongsToMany, Column, DataType } from 'sequelize-typescript'

import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { CategoryModel } from '../category/category.model'
import { TypeWithCategoriesDto } from '../type-categories/dto/type-categories.dto'
import { TypeCategoriesModel } from '../type-categories/type-categories.model'
import { TypeDto } from './dto/type.dto'

export enum TypeIdEnum {
  RECALL_BANKRUPTCY = '065C3FD9-58D1-436F-9FB8-C1F5C214FA50',
  RECALL_DECEASED = 'BC6384F4-91B0-48FE-9A3A-B528B0AA6468',
  DIVISION_MEETING = 'F1A7CE20-37BE-451B-8AA7-BC90B8A7E7BD',
  DIVISION_ENDING = 'D40BED80-6D9C-4388-AEA8-445B27614D8A',
}

@BaseEntityTable({ tableName: LegalGazetteModels.ADVERT_TYPE })
export class TypeModel extends BaseEntityModel<TypeDto> {
  @BelongsToMany(() => CategoryModel, { through: () => TypeCategoriesModel })
  categories!: CategoryModel[]

  @Column({
    type: DataType.TEXT,
    field: 'title',
    allowNull: false,
  })
  title!: string

  static fromModelWithCategories(model: TypeModel): TypeWithCategoriesDto {
    return {
      id: model.id,
      title: model.title,
      slug: model.slug,
      categories: model.categories.map((category) => category.fromModel()),
    }
  }

  fromModelWithCategories(): TypeWithCategoriesDto {
    return TypeModel.fromModelWithCategories(this)
  }
}
