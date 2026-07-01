import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { ReportModel } from '../../report/models/report.model'
import type { ReportEmployeeRoleDto } from '../dto/report-employee-role.dto'

type ReportEmployeeRoleAttributes = {
  title: string
  reportId: string
}

type ReportEmployeeRoleCreateAttributes = {
  title: string
  reportId: string
}

@MutableTable({ tableName: DoeModels.REPORT_EMPLOYEE_ROLE })
export class ReportEmployeeRoleModel extends MutableModel<
  ReportEmployeeRoleAttributes,
  ReportEmployeeRoleCreateAttributes
> {
  @Column({ type: DataType.TEXT, allowNull: false })
  title!: string

  @ForeignKey(() => ReportModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'report_id' })
  reportId!: string

  @BelongsTo(() => ReportModel, { foreignKey: 'reportId', as: 'report' })
  report?: ReportModel

  static fromModel(model: ReportEmployeeRoleModel): ReportEmployeeRoleDto {
    return {
      id: model.id,
      title: model.title,
      reportId: model.reportId,
    }
  }

  fromModel(): ReportEmployeeRoleDto {
    return ReportEmployeeRoleModel.fromModel(this)
  }
}
