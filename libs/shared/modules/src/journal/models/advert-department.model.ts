import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript'

import { AdvertTypeModel } from './advert-type.model'

@Table({ tableName: 'advert_department', timestamps: false })
export class AdvertDepartmentModel extends Model {
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

  @HasMany(() => AdvertTypeModel, 'department_id')
  adTypes?: AdvertTypeModel[]
}
