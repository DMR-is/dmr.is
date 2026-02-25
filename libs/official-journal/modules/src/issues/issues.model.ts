import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { advertDepartmentMigrate } from '../journal/migrations'
import { AdvertDepartmentModel } from '../journal/models'
import { IssueDto } from './issues.dto'
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
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>

@DefaultScope(() => ({
  include: [
    {
      model: AdvertDepartmentModel,
      as: 'department',
    },
  ],
  order: [['startDate', 'DESC']],
}))
@BaseTable({ tableName: 'monthly_issues' })
export class IssuesModel extends BaseModel<
  IssuesAttributes,
  IssuesCreationAttributes
> {
  @Column({
    type: DataType.UUID,
    field: 'department_id',
    unique: 'department_date_range_constraint',
  })
  departmentId!: string

  @Column({
    type: DataType.DATE,
    field: 'start_date',
    unique: 'department_date_range_constraint',
    get() {
      const rawValue = this.getDataValue('startDate')
      return rawValue ? new Date(rawValue) : null
    },
  })
  startDate!: Date

  @Column({
    type: DataType.DATE,
    field: 'end_date',
    unique: 'department_date_range_constraint',
    get() {
      const rawValue = this.getDataValue('endDate')
      return rawValue ? new Date(rawValue) : null
    },
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

  @BelongsTo(() => AdvertDepartmentModel, 'departmentId')
  department!: AdvertDepartmentModel

  formatTitle() {
    const monthNumber = this.startDate.getMonth() + 1
    const monthName = getMonthName(this.startDate)
    const year = this.startDate.getFullYear()
    const departmentTitle = mapDepartmentIdToTitle(this.departmentId)

    return `Hefti ${monthNumber} - ${departmentTitle} - ${monthName} ${year}`
  }

  static fromModel(model: IssuesModel): IssueDto {
    return {
      id: model.id,
      department: advertDepartmentMigrate(model.department),
      startDate: model.startDate,
      formattedTitle: model.formatTitle(),
      endDate: model.endDate,
      title: model.title,
      url: model.url,
    }
  }

  fromModel() {
    return IssuesModel.fromModel(this)
  }
}
