import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import type { ReportEmployeeDeviationDto } from '../dto/report-employee-deviation.dto'
import { ReportEmployeeModel } from './report-employee.model'

type ReportEmployeeDeviationAttributes = {
  reportEmployeeId: string
  reason: string
  action: string
  signatureName: string
  signatureRole: string
}

type ReportEmployeeDeviationCreateAttributes = ReportEmployeeDeviationAttributes

@MutableTable({ tableName: DoeModels.REPORT_EMPLOYEE_DEVIATION })
export class ReportEmployeeDeviationModel extends MutableModel<
  ReportEmployeeDeviationAttributes,
  ReportEmployeeDeviationCreateAttributes
> {
  @ForeignKey(() => ReportEmployeeModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'report_employee_id',
  })
  reportEmployeeId!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  reason!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  action!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'signature_name' })
  signatureName!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'signature_role' })
  signatureRole!: string

  @BelongsTo(() => ReportEmployeeModel, {
    foreignKey: 'reportEmployeeId',
    as: 'reportEmployee',
  })
  reportEmployee?: ReportEmployeeModel

  static fromModel(
    model: ReportEmployeeDeviationModel,
  ): ReportEmployeeDeviationDto {
    return {
      id: model.id,
      reportEmployeeId: model.reportEmployeeId,
      reason: model.reason,
      action: model.action,
      signatureName: model.signatureName,
      signatureRole: model.signatureRole,
    }
  }

  fromModel(): ReportEmployeeDeviationDto {
    return ReportEmployeeDeviationModel.fromModel(this)
  }
}
