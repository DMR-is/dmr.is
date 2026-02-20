import { BeforeCreate, BelongsTo, Column, DataType, DefaultScope } from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { AdvertDepartmentModel } from '../journal/models'
import { getMonthName, mapDepartmentIdToTitle } from './utils'


type IssuesAttributes = {
  id: string
  departmentId: string
  startDate: Date
  endDate: Date
  title: string
  url: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export type IssuesCreationAttributes = Omit<
  IssuesAttributes,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'title'
>

@DefaultScope(() => ({
  include: [
    {
      model: AdvertDepartmentModel,
      as: 'department',
    },
  ],
  order: [['createdAt', 'DESC']],
}))
@BaseTable({ tableName: 'monthly_issues' })
export class IssuesModel extends BaseModel<IssuesAttributes, IssuesCreationAttributes> {
  @Column({
    type: DataType.UUID,
    field: 'department_id',
  })
  departmentId!: string

  @Column({
    type: DataType.DATE,
    field: 'start_date',
  })
  startDate!: Date

  @Column({
    type: DataType.DATE,
    field: 'end_date',
  })
  endDate!: Date

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  title!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  url!: string

  @BeforeCreate
  static setTitle(instance: IssuesModel) {
    const monthName = getMonthName(instance.startDate)
    const year = instance.startDate.getFullYear()
    const departmentTitle = mapDepartmentIdToTitle(instance.departmentId)

    instance.title = `Stjórnartíðindi ${departmentTitle} - ${monthName} ${year}`
  }

  @BelongsTo(() => AdvertDepartmentModel, 'departmentId')
  department!: AdvertDepartmentModel
}
