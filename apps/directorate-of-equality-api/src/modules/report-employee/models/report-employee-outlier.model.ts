import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import type { ReportEmployeeOutlierDto } from '../dto/report-employee-outlier.dto'
import { ReportEmployeeModel } from './report-employee.model'

/**
 * Shape of the per-employee entry on the canonical outlier analysis. Defined
 * structurally rather than re-using `SalaryOutlierAnalysisEmployeeSnapshot`
 * directly so both call paths — admin (reads the raw model snapshot with the
 * strict `'ABOVE' | 'BELOW' | 'EQUAL'` union) and application (reads the
 * DTO-projected variant with `direction: string | null`) — can pass their
 * matching entry without an unsafe cast.
 */
export type OutlierAnalysisEntry = {
  adjustedBaseSalary: number
  predictedBaseSalary: number | null
  scoreBucketRangeFrom: number | null
  scoreBucketRangeTo: number | null
  direction: string | null
  differencePercent: number | null
  allowedDifferencePercent: number
}

type ReportEmployeeOutlierAttributes = {
  reportEmployeeId: string
  reason: string | null
  action: string | null
  signatureName: string | null
  signatureRole: string | null
}

type ReportEmployeeOutlierCreateAttributes = {
  reportEmployeeId: string
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

  /**
   * Project an outlier row to its DTO. The persisted row only carries the
   * applicant's improvement-plan response (reason / action / signature). The
   * analysis numbers (`adjustedBaseSalary`, regression prediction, score
   * bucket, direction, etc.) live in `report_result.outlier_analysis_snapshot`
   * as the canonical "what the engine detected at submit time" — callers are
   * expected to look that up by the joined `reportEmployee.ordinal` and pass
   * the matching entry in via `analysis`. Pass `null` when the matching entry
   * is unavailable; the analysis-derived fields then surface as null.
   */
  static fromModel(
    model: ReportEmployeeOutlierModel,
    analysis: OutlierAnalysisEntry | null = null,
  ): ReportEmployeeOutlierDto {
    return {
      id: model.id,
      reportEmployeeId: model.reportEmployeeId,
      employeeOrdinal: model.reportEmployee?.ordinal ?? null,
      gender: model.reportEmployee?.gender ?? null,
      roleTitle: model.reportEmployee?.role?.title ?? null,
      reason: model.reason,
      action: model.action,
      signatureName: model.signatureName,
      signatureRole: model.signatureRole,
      adjustedBaseSalary: analysis?.adjustedBaseSalary ?? null,
      predictedBaseSalary: analysis?.predictedBaseSalary ?? null,
      scoreBucketRangeFrom: analysis?.scoreBucketRangeFrom ?? null,
      scoreBucketRangeTo: analysis?.scoreBucketRangeTo ?? null,
      direction: analysis?.direction ?? null,
      differencePercent: analysis?.differencePercent ?? null,
      allowedDifferencePercent: analysis?.allowedDifferencePercent ?? null,
    }
  }

  fromModel(
    analysis: OutlierAnalysisEntry | null = null,
  ): ReportEmployeeOutlierDto {
    return ReportEmployeeOutlierModel.fromModel(this, analysis)
  }
}
