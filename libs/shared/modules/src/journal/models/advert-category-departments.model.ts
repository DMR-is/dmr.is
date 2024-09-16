import {
  Column,
  DataType,
  HasOne,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { AdvertModel } from './advert.model'
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
  advert?: AdvertModel

  @HasOne(() => AdvertCategoryModel, 'id')
  category?: AdvertCategoryModel
}
