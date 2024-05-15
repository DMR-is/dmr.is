import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript'

import { AdvertTypeDTO } from './AdvertType'

@Table({ tableName: 'advert_department', timestamps: false })
export class AdvertDepartmentDTO extends Model {
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

  @HasMany(() => AdvertTypeDTO, 'department_id')
  adTypes?: AdvertTypeDTO[]
}
