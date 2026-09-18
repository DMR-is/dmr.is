import { CompanyDto } from '../../company/dto/company.dto'
import { SalaryAnalysisResponseDto } from '../../report-statistics/dto/salary-analysis.response.dto'

/**
 * Read-time derivation for a DRAFT salary report. Employee scores are NULL
 * while drafting (computed and frozen only at submit), so this service derives
 * them on the fly from the persisted scoring graph — role/personal step
 * assignments summed over the steps' scores — and feeds the same outlier
 * detection + chart the parsed-payload preview uses. Nothing is persisted.
 */
export interface IReportDraftAnalysisService {
  /** Derived salary-analysis preview (outliers + gender/score chart). */
  analyzeDraft(
    providerId: string,
    company: CompanyDto,
  ): Promise<SalaryAnalysisResponseDto>

  /**
   * The employee ids currently detected as outliers for the report (derived).
   * Intra-module helper for outlier-group validation — takes the already
   * resolved `reportId`.
   */
  getDetectedOutlierEmployeeIds(reportId: string): Promise<Set<string>>

  /**
   * Computes each employee's score from the persisted scoring graph and writes
   * it to `report_employee.score`. Called at submit to freeze the scores the
   * report_result snapshot then reads. Intra-module helper (resolved reportId).
   */
  persistScores(reportId: string): Promise<void>
}

export const IReportDraftAnalysisService = Symbol(
  'IReportDraftAnalysisService',
)
