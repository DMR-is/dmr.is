import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import type { SalaryResultSnapshot } from '../../report/lib/compensation-aggregates'
import { type WageGapDecompositionSnapshot } from '../../report/lib/wage-gap-decomposition'
import { ReportModel } from '../../report/models/report.model'
import { computePayDispersion } from '../../report-statistics/lib/pay-dispersion'
import type { ReportResultDto } from '../dto/report-result.dto'

const parseDecimal = (raw: unknown): number | null =>
  raw === null || raw === undefined ? null : parseFloat(raw as string)

export type ReportResultAttributes = {
  reportId: string
  salaryDifferenceThresholdPercent: number | null
  calculationVersion: string
  salarySnapshot: SalaryResultSnapshot
  wageGapDecompositionSnapshot: WageGapDecompositionSnapshot
}

export type ReportResultCreateAttributes = Omit<
  ReportResultAttributes,
  'calculationVersion'
> & {
  calculationVersion?: string
}

@MutableTable({ tableName: DoeModels.REPORT_RESULT })
export class ReportResultModel extends MutableModel<
  ReportResultAttributes,
  ReportResultCreateAttributes
> {
  @ForeignKey(() => ReportModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    unique: true,
    field: 'report_id',
  })
  reportId!: string

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
    field: 'salary_difference_threshold_percent',
    get() {
      return parseDecimal(this.getDataValue('salaryDifferenceThresholdPercent'))
    },
  })
  salaryDifferenceThresholdPercent!: number | null

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: 'v1',
    field: 'calculation_version',
  })
  calculationVersion!: string

  /**
   * Frozen-at-submit summary of reglulegt tímakaup. One snapshot, not the
   * former base/full pair: a base-pay-only numerator over an hours denominator
   * that includes overtime hours is incoherent, so there is nothing for a
   * second variant to hold.
   */
  @Column({
    type: DataType.JSONB,
    allowNull: false,
    field: 'salary_snapshot',
  })
  salarySnapshot!: SalaryResultSnapshot

  /**
   * Frozen Oaxaca-Blinder decomposition. Always present — a company that cannot
   * be measured (only one gender) still gets a snapshot carrying
   * `oskyrtAvailable: false`, its blockers and real cohort counts, because
   * "not computable" is a state of a valid report rather than a missing value.
   *
   * `oskyrtPercent` here is the figure the 3,9% benchmark tests — NOT
   * `salarySnapshot.totals.salaryDifferences.maleFemale`, which is the
   * unadjusted cohort-mean gap. The two are not interchangeable and land on
   * opposite sides of the line on real data.
   */
  @Column({
    type: DataType.JSONB,
    allowNull: false,
    field: 'wage_gap_decomposition_snapshot',
  })
  wageGapDecompositionSnapshot!: WageGapDecompositionSnapshot

  @BelongsTo(() => ReportModel, { foreignKey: 'reportId', as: 'report' })
  report?: ReportModel

  static fromModel(model: ReportResultModel): ReportResultDto {
    return {
      id: model.id,
      reportId: model.reportId,
      salaryDifferenceThresholdPercent: model.salaryDifferenceThresholdPercent,
      calculationVersion: model.calculationVersion,
      salary: model.salarySnapshot,
      // ⚠️ The stored JSONB, verbatim and unnormalised. Consumers of the newer
      // fields must fail closed rather than assume presence — a row frozen
      // before a field existed yields `undefined`, not `false`.
      wageGapDecomposition: model.wageGapDecompositionSnapshot,
      // Derived here, on every read, rather than stored. One call site so the
      // reviewer web and the PDF cannot disagree, and so an advisory rule stays
      // tunable without rewriting published history. Cheap: one pass over
      // `employees[]`, which is already in memory.
      payDispersion: computePayDispersion(model.wageGapDecompositionSnapshot),
    }
  }

  fromModel(): ReportResultDto {
    return ReportResultModel.fromModel(this)
  }
}
