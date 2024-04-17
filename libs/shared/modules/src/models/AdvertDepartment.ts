import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript'

import { AdvertType } from './AdvertType'

@Table({ tableName: 'advert_department', timestamps: false })
export class AdvertDepartment extends Model {
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

  @HasMany(() => AdvertType, 'department_id')
  adTypes?: AdvertType[]
}
