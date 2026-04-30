import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import type { ReportEmployeeOutlierDto } from '../dto/report-employee-outlier.dto'
import { ReportEmployeeModel } from './report-employee.model'

type ReportEmployeeOutlierAttributes = {
  reportEmployeeId: string
  postponed: boolean
  reason: string | null
  action: string | null
  signatureName: string | null
  signatureRole: string | null
}

type ReportEmployeeOutlierCreateAttributes = {
  reportEmployeeId: string
  postponed?: boolean
  reason?: string | null
  action?: string | null
  signatureName?: string | null
  signatureRole?: string | null
}

@MutableTable({ tableName: DoeModels.REPORT_EMPLOYEE_OUTLIER })
export class ReportEmployeeOutlierModel extends MutableModel<
  ReportEmployeeOutlierAttributes,
  ReportEmployeeOutlierCreateAttributes
> {
  @ForeignKey(() => ReportEmployeeModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'report_employee_id',
  })
  reportEmployeeId!: string

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  postponed!: boolean

  @Column({ type: DataType.TEXT, allowNull: true })
  reason!: string | null

  @Column({ type: DataType.TEXT, allowNull: true })
  action!: string | null

  @Column({ type: DataType.TEXT, allowNull: true, field: 'signature_name' })
  signatureName!: string | null

  @Column({ type: DataType.TEXT, allowNull: true, field: 'signature_role' })
  signatureRole!: string | null

  @BelongsTo(() => ReportEmployeeModel, {
    foreignKey: 'reportEmployeeId',
    as: 'reportEmployee',
  })
  reportEmployee?: ReportEmployeeModel

  static fromModel(
    model: ReportEmployeeOutlierModel,
  ): ReportEmployeeOutlierDto {
    return {
      id: model.id,
      reportEmployeeId: model.reportEmployeeId,
      postponed: model.postponed,
      reason: model.reason,
      action: model.action,
      signatureName: model.signatureName,
      signatureRole: model.signatureRole,
    }
  }

  fromModel(): ReportEmployeeOutlierDto {
    return ReportEmployeeOutlierModel.fromModel(this)
  }
}
