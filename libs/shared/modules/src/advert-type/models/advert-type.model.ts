import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DefaultScope,
  HasOne,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import { AdvertDepartmentModel } from '../../journal/models'
import { AdvertMainTypeModel } from './advert-main-type.model'

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

  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'department_id',
  })
  departmentId!: string

  @BelongsTo(() => AdvertDepartmentModel, 'department_id')
  department!: AdvertDepartmentModel

  @Column({
    type: DataType.UUIDV4,
    allowNull: true,
    field: 'main_type_id',
  })
  mainTypeId?: string

  @HasOne(() => AdvertMainTypeModel, 'id')
  mainType?: AdvertMainTypeModel

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date
}
