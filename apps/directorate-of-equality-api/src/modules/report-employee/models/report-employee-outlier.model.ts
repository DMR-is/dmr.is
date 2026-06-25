import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import type { ReportEmployeeOutlierDto } from '../dto/report-employee-outlier.dto'
import { ReportEmployeeModel } from './report-employee.model'
import { ReportOutlierGroupModel } from './report-outlier-group.model'

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
  groupId: string
}

type ReportEmployeeOutlierCreateAttributes = {
  reportEmployeeId: string
  groupId: string
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

  // Every outlier always belongs to a group. When a report is submitted with
  // outliers postponed the rows point at a single default group whose
  // explanation fields are NULL until the applicant resolves them.
  @ForeignKey(() => ReportOutlierGroupModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'group_id' })
  groupId!: string

  @BelongsTo(() => ReportEmployeeModel, {
    foreignKey: 'reportEmployeeId',
    as: 'reportEmployee',
  })
  reportEmployee?: ReportEmployeeModel

  @BelongsTo(() => ReportOutlierGroupModel, {
    foreignKey: 'groupId',
    as: 'group',
  })
  group?: ReportOutlierGroupModel

  /**
   * Project an outlier row to its DTO. The persisted row is a thin join
   * `(report_employee_id, group_id)`. The improvement-plan explanation
   * (reason / action / signature) lives on the joined group and is
   * denormalized onto each outlier in the projection — pass the row with its
   * `group` association loaded. While the report's outliers are still postponed
   * the group exists but its explanation fields are null.
   *
   * The analysis numbers (`adjustedBaseSalary`, regression prediction, score
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
      score: model.reportEmployee?.score ?? null,
      groupId: model.groupId,
      groupName: model.group?.name ?? null,
      reason: model.group?.reason ?? null,
      action: model.group?.action ?? null,
      signatureName: model.group?.signatureName ?? null,
      signatureRole: model.group?.signatureRole ?? null,
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
