import { Column, DataType } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import type { ReportEmployeeRoleDto } from '../dto/report-employee-role.dto'

type ReportEmployeeRoleAttributes = {
  title: string
}

type ReportEmployeeRoleCreateAttributes = {
  title: string
}

@MutableTable({ tableName: DoeModels.REPORT_EMPLOYEE_ROLE })
export class ReportEmployeeRoleModel extends MutableModel<
  ReportEmployeeRoleAttributes,
  ReportEmployeeRoleCreateAttributes
> {
  @Column({ type: DataType.TEXT, allowNull: false })
  title!: string

  static fromModel(model: ReportEmployeeRoleModel): ReportEmployeeRoleDto {
    return {
      id: model.id,
      title: model.title,
    }
  }

  fromModel(): ReportEmployeeRoleDto {
    return ReportEmployeeRoleModel.fromModel(this)
  }
}
