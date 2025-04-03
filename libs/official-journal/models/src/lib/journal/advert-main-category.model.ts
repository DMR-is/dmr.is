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
import { AdvertDepartmentModel } from './advert-department.model'
import { OfficialJournalModels } from '../constants'

@Table({ tableName: OfficialJournalModels.MAIN_CATEGORY, timestamps: false })
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
  department!: AdvertDepartmentModel

  @BelongsToMany(() => AdvertCategoryModel, {
    through: { model: () => AdvertCategoryCategoriesModel },
  })
  categories?: AdvertCategoryModel[]
}
