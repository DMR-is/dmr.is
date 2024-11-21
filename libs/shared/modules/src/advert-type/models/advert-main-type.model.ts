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
import { AdvertTypeModelNew } from './advert-type.model'

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

  @Column
  title!: string

  @Column
  slug!: string

  @Column({ field: 'department_id' })
  departmentId!: string

  @BelongsTo(() => AdvertDepartmentModel, 'department_id')
  department!: AdvertDepartmentModel

  @HasMany(() => AdvertTypeModelNew, 'main_type_id')
  types?: AdvertTypeModelNew[]

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date
}
