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
import { AdvertDepartment } from './AdvertDepartment'

@Table({ tableName: 'advert_type', timestamps: true })
@DefaultScope(() => ({
  attributes: {
    exclude: ['department_id', 'created', 'updated'],
  },
}))
export class AdvertType extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  id!: string

  @Column
  title!: string

  @Column
  slug!: string

  @Column({ field: 'department_id' })
  departmentId!: string

  @BelongsTo(() => AdvertDepartment, 'department_id')
  department!: AdvertDepartment

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date
}
