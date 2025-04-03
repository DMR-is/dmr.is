import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DefaultScope,
  HasMany,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import { AdvertDepartmentModel } from '../../journal/models'
import { AdvertTypeModel } from './advert-type.model'

@Table({ tableName: 'advert_main_type', timestamps: true })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class AdvertMainTypeModel extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  get title(): string {
    const rawTitle = this.getDataValue('title')
    if (!rawTitle) return rawTitle
    return rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1).toLowerCase()
  }

  set title(value: string) {
    this.setDataValue('title', value)
  }

  @Column
  slug!: string

  @Column({ field: 'department_id' })
  departmentId!: string

  @BelongsTo(() => AdvertDepartmentModel, 'department_id')
  department!: AdvertDepartmentModel

  @HasMany(() => AdvertTypeModel, 'main_type_id')
  types?: AdvertTypeModel[]

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date
}
