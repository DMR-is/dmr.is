// Association annotations use a type-only alias - see `src/models.md`.
import {
  Column,
  DataType,
  HasOne,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import type { AdvertModel as AdvertModelRef } from './advert.model'
import { AdvertModel } from './advert.model'
import type { AdvertCategoryModel as AdvertCategoryModelRef } from './advert-category.model'
import { AdvertCategoryModel } from './advert-category.model'

@Table({ tableName: 'category_departments', timestamps: false })
export class AdvertCategoryDepartmentsModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
  })
  department_id!: string

  @PrimaryKey
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
  })
  category_id!: string

  @HasOne(() => AdvertModel, 'id')
  advert?: AdvertModelRef

  @HasOne(() => AdvertCategoryModel, 'id')
  category?: AdvertCategoryModelRef
}
