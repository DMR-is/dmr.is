import {
  Column,
  DataType,
  HasOne,
  Model,
  NotNull,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { AdvertDTO } from './Advert'
import { AdvertCategoryDTO } from './AdvertCategory'

@Table({ tableName: 'category_departments', timestamps: false })
export class CategoryDepartmentsDTO extends Model {
  @PrimaryKey
  @NotNull
  @Column({
    type: DataType.UUIDV4,
  })
  department_id!: string

  @PrimaryKey
  @NotNull
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
  })
  category_id!: string

  @HasOne(() => AdvertDTO, 'id')
  advert?: AdvertDTO

  @HasOne(() => AdvertCategoryDTO, 'id')
  category?: AdvertCategoryDTO
}
