// Association annotations use a type-only alias - see `src/models.md`.
import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript'

import { AdvertCategoryModel } from './advert-category.model'
import { AdvertCategoryCategoriesModel } from './advert-category-categories.model'
import type { AdvertDepartmentModel as AdvertDepartmentModelRef } from './advert-department.model'
import { AdvertDepartmentModel } from './advert-department.model'

@Table({ tableName: 'advert_main_category', timestamps: false })
export class AdvertMainCategoryModel extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({ allowNull: false })
  title!: string

  @Column({ allowNull: false })
  slug!: string

  @Column
  description!: string

  @ForeignKey(() => AdvertDepartmentModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'department_id',
  })
  departmentId!: string

  @BelongsTo(() => AdvertDepartmentModel)
  department!: AdvertDepartmentModelRef

  @BelongsToMany(() => AdvertCategoryModel, {
    through: { model: () => AdvertCategoryCategoriesModel },
  })
  categories?: AdvertCategoryModel[]
}
