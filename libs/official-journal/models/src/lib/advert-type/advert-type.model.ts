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

import { AdvertMainTypeModel } from './advert-main-type.model'
import { OfficialJournalModels } from '../constants'
import { AdvertDepartmentModel } from '../journal/advert-department.model'

@Table({ tableName: OfficialJournalModels.ADVERT_TYPE, timestamps: true })
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

  @ForeignKey(() => AdvertMainTypeModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: true,
    field: 'main_type_id',
  })
  mainTypeId?: string

  @BelongsTo(() => AdvertMainTypeModel)
  mainType?: AdvertMainTypeModel

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date
}
