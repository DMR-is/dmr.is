// Association annotations use a type-only alias — see `src/models.ts`.
import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ImmutableModel, ImmutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import type { ReportModel as ReportModelRef } from '../../report/models/report.model'
import { ReportModel } from '../../report/models/report.model'
import type { PublicReportDto } from '../dto/public-report.dto'

/**
 * ⚠️ **These attributes list exactly the columns the table has, and that is a
 * deliberate correction made 2026-08-20.**
 *
 * The types previously also declared `averageMaleSalary`,
 * `averageFemaleSalary`, `averageNeutralSalary` and six `salaryDifference*`
 * fields. **No migration ever created any of them**, and they carried no
 * `@Column` decorator either — so sequelize ignored them completely. They would
 * not have thrown; they would have been **silently dropped**, which is worse:
 * whoever built the publication surface would have passed the figures in and
 * watched them vanish.
 *
 * ── What to add when this surface is actually built ──────────────────────────
 *
 * The figures are still relevant and still computable. But do NOT restore the
 * old names or shape:
 *
 * - `average*Salary` are **monthly** names. Every figure in this product is now
 *   reglulegt tímakaup, so publish rates and name them accordingly
 *   (`averageMaleHourlyWage`, …). Reusing the old names would re-declare the
 *   monthly world in the one place designed to publish numbers publicly.
 * - The six `salaryDifference*` fields were a 3×3 gender matrix (M→F, M→N, F→M,
 *   F→N, N→M, N→F). NEUTRAL is bundled into FEMALE for every computation and
 *   display, so **four of the six were permanently null** — six columns to carry
 *   one number. Publish the M-vs-(F+N) figure the product actually measures.
 *
 *   ⚠️ That is a statement about the CURRENT product goal, not a closed door.
 *   `report_employee.gender` keeps the raw `NEUTRAL` value, the DB enum still
 *   accepts all three, and `wage_gap_decomposition_snapshot.employees[]` stores
 *   each employee's raw gender beside their score and tímakaup — so a genuine
 *   three-way analysis remains derivable from any submitted report. If the
 *   Directorate ever wants a standalone neutral category, the data is there;
 *   what should not be resurrected is six columns where four are always null.
 * - The figure with regulatory meaning is now **óskýrður (leiðréttur)
 *   launamunur** from `report_result.wage_gap_decomposition_snapshot`, not a
 *   difference of raw averages. Decide deliberately which of the two a public
 *   page should carry.
 *
 * Add the columns in the same migration that adds the code which writes them —
 * not before, or this drifts again.
 */
type PublicReportAttributes = {
  sourceReportId: string
  sizeBucket: string
  isatCategory: string
  publishedAt: Date
  validUntil: Date
}

type PublicReportCreateAttributes = {
  sourceReportId: string
  sizeBucket: string
  isatCategory: string
  publishedAt?: Date
  validUntil: Date
}

@ImmutableTable({ tableName: DoeModels.PUBLIC_REPORT })
export class PublicReportModel extends ImmutableModel<
  PublicReportAttributes,
  PublicReportCreateAttributes
> {
  @ForeignKey(() => ReportModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'source_report_id',
  })
  sourceReportId!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'size_bucket' })
  sizeBucket!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'isat_category' })
  isatCategory!: string

  @Column({ type: DataType.DATE, allowNull: false, field: 'published_at' })
  publishedAt!: Date

  @Column({ type: DataType.DATE, allowNull: false, field: 'valid_until' })
  validUntil!: Date

  @BelongsTo(() => ReportModel, {
    foreignKey: 'sourceReportId',
    as: 'sourceReport',
  })
  sourceReport!: ReportModelRef

  static fromModel(model: PublicReportModel): PublicReportDto {
    return {
      id: model.id,
      sizeBucket: model.sizeBucket,
      isatCategory: model.isatCategory,
      publishedAt: model.publishedAt,
      validUntil: model.validUntil,
    }
  }

  fromModel(): PublicReportDto {
    return PublicReportModel.fromModel(this)
  }
}
