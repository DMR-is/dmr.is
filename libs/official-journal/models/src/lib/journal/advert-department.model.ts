import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript'

import { AdvertMainTypeModel } from '../advert-type/advert-main-type.model'
import { CaseModel } from '../case/case.model'
import { OfficialJournalModels } from '../constants'

export enum DepartmentEnum {
  A = 'A deild',
  B = 'B deild',
  C = 'C deild',
}

@Table({ tableName: OfficialJournalModels.DEPARTMENT, timestamps: false })
export class AdvertDepartmentModel extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column
  title!: DepartmentEnum

  @Column
  slug!: string

  @HasMany(() => AdvertMainTypeModel, 'department_id')
  mainTypes?: AdvertMainTypeModel[]

  @HasMany(() => CaseModel, 'department_id')
  cases?: CaseModel[]
}
