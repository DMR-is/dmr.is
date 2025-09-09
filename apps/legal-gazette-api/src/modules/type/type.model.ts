import { BelongsToMany, Column, DataType } from 'sequelize-typescript'

import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { CategoryModel } from '../category/category.model'
import { TypeWithCategoriesDto } from '../type-categories/dto/type-categories.dto'
import { TypeCategoriesModel } from '../type-categories/type-categories.model'
import { TypeDto } from './dto/type.dto'

export enum TypeIdEnum {
  COMMON_ADVERT = 'a58fe2a8-b0a9-47bd-b424-4b9cece0e622',
  RECALL = '67cd8559-ea7a-45ae-8de1-e87005c35531',
  DIVISION_MEETING = '5b3dded4-e6c2-411e-a9e0-213bea06af17',
  DIVISION_ENDING = '8819e35e-89ef-4110-bf18-905df2ae122c',
}

export enum TypeEnum {
  COMMON_ADVERT = 'Almenn auglýsing',
  RECALL = 'Innköllun',
  DIVISION_MEETING = 'Skiptafundur',
  DIVISION_ENDING = 'Skiptalok',
}

@BaseEntityTable({ tableName: LegalGazetteModels.ADVERT_TYPE })
export class TypeModel extends BaseEntityModel<TypeDto> {
  @BelongsToMany(() => CategoryModel, { through: () => TypeCategoriesModel })
  categories!: CategoryModel[]

  @Column({
    type: DataType.ENUM(...Object.values(TypeEnum)),
    field: 'title',
    allowNull: false,
  })
  title!: TypeEnum

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
