import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import type { SalaryResultSnapshot } from '../../report/lib/compensation-aggregates'
import { ReportEmployeeRoleModel } from '../../report-employee/models/report-employee-role.model'
import type { ReportRoleResultDto } from '../dto/report-result.dto'
import { ReportResultModel } from './report-result.model'

type ReportRoleResultAttributes = {
  reportResultId: string
  reportEmployeeRoleId: string
  roleTitle: string
  baseSnapshot: SalaryResultSnapshot
  fullSnapshot: SalaryResultSnapshot
}

type ReportRoleResultCreateAttributes = ReportRoleResultAttributes

@MutableTable({ tableName: DoeModels.REPORT_ROLE_RESULT })
export class ReportRoleResultModel extends MutableModel<
  ReportRoleResultAttributes,
  ReportRoleResultCreateAttributes
> {
  @ForeignKey(() => ReportResultModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'report_result_id',
  })
  reportResultId!: string

  @ForeignKey(() => ReportEmployeeRoleModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'report_employee_role_id',
  })
  reportEmployeeRoleId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'role_title',
  })
  roleTitle!: string

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    field: 'base_snapshot',
  })
  baseSnapshot!: SalaryResultSnapshot

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    field: 'full_snapshot',
  })
  fullSnapshot!: SalaryResultSnapshot

  @BelongsTo(() => ReportResultModel, {
    foreignKey: 'reportResultId',
    as: 'reportResult',
  })
  reportResult?: ReportResultModel

  @BelongsTo(() => ReportEmployeeRoleModel, {
    foreignKey: 'reportEmployeeRoleId',
    as: 'role',
  })
  role?: ReportEmployeeRoleModel

  static fromModel(model: ReportRoleResultModel): ReportRoleResultDto {
    return {
      id: model.id,
      reportResultId: model.reportResultId,
      reportEmployeeRoleId: model.reportEmployeeRoleId,
      roleTitle: model.roleTitle,
      base: model.baseSnapshot,
      full: model.fullSnapshot,
    }
  }

  fromModel(): ReportRoleResultDto {
    return ReportRoleResultModel.fromModel(this)
  }
}
