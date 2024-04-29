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

import { AdvertDepartmentDTO } from './AdvertDepartment'

@Table({ tableName: 'advert_type', timestamps: true })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class AdvertTypeDTO extends Model {
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

  @BelongsTo(() => AdvertDepartmentDTO, 'department_id')
  department!: AdvertDepartmentDTO

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date

  @Column({ type: DataType.UUIDV4 })
  legacy_id!: string
}
