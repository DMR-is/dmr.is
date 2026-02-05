import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript'

import { AdvertMainTypeModel } from '../../advert-type/models'
import { CaseModel } from '../../case/models'

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

  @HasMany(() => AdvertMainTypeModel, 'department_id')
  mainTypes?: AdvertMainTypeModel[]

  @HasMany(() => CaseModel, 'department_id')
  cases?: CaseModel[]
}
