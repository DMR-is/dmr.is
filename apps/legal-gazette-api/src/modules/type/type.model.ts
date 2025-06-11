import { Column, DataType, HasMany } from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { CategoryModel } from '../category/category.model'

export enum TypeIdEnum {
  COMMON_APPLICATION = 'a58fe2a8-b0a9-47bd-b424-4b9cece0e622',
}

export enum TypeEnum {
  COMMON_APPLICATION = 'Almenn auglýsing',
}

@BaseEntityTable({ tableName: LegalGazetteModels.ADVERT_TYPE })
export class TypeModel extends BaseEntityModel {
  @HasMany(() => CategoryModel)
  categories!: CategoryModel[]

  @Column({
    type: DataType.ENUM(...Object.values(TypeEnum)),
    field: 'title',
    allowNull: false,
  })
  title!: TypeEnum
}
