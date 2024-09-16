import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DefaultScope,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import { AdvertDepartmentModel } from './advert-department.model'

@Table({ tableName: 'advert_type', timestamps: true })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class AdvertTypeModel extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column
  title!: string

  @Column
  slug!: string

  @Column({ field: 'department_id' })
  departmentId!: string

  @BelongsTo(() => AdvertDepartmentModel, 'department_id')
  department!: AdvertDepartmentModel

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date

  @Column({ type: DataType.UUIDV4 })
  legacy_id!: string
}
