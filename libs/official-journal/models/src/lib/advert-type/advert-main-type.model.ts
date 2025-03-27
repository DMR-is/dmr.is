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

import { AdvertTypeModel } from './advert-type.model'
import { OfficialJournalModels } from '../constants'
import { AdvertDepartmentModel } from '../journal/advert-department.model'

@Table({ tableName: OfficialJournalModels.ADVERT_MAIN_TYPE, timestamps: true })
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

  @HasMany(() => AdvertTypeModel, 'main_type_id')
  types?: AdvertTypeModel[]

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date
}
