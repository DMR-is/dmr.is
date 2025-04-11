import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DefaultScope,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import { AdvertDepartmentModel } from '../../journal/models'
import { AdvertMainTypeModel } from './advert-main-type.model'
import { allCapsTitle } from './stringUtils'

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

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  get title(): string {
    return allCapsTitle(this.getDataValue('title'))
  }

  set title(value: string) {
    this.setDataValue('title', value)
  }

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

  @ForeignKey(() => AdvertMainTypeModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'main_type_id',
  })
  mainTypeId!: string

  @BelongsTo(() => AdvertMainTypeModel)
  mainType!: AdvertMainTypeModel

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date
}
