export interface ReportPdfResult {
  /** The rendered PDF as a binary buffer. */
  pdf: Buffer
  /** Suggested download file name, derived from the report type. */
  fileName: string
}

export interface IReportPdfService {
  /**
   * Generates the PDF for a report, choosing the layout
   * ("Jafnlaunaúttekt" vs. "Jafnréttisáætlun") from the report type.
   */
  generateReportPdf(reportId: string): Promise<ReportPdfResult>

  /**
   * Generates the úrbótaáætlun as its own document — the lágmarksmengi grouped
   * by the groups the company defined, each with its ástæða, aðgerð and
   * signature.
   *
   * Separate from `generateReportPdf` because it is a different statement: the
   * report is what the Directorate assessed, this is what the company committed
   * to. SALARY only — an equality report has no outlier groups.
   *
   * Returns `null` when the report has no outlier groups, rather than an empty
   * document. A compliant company has no plan to state, and its salary report
   * already carries that as a finding ("engar úrbætur nauðsynlegar"); attaching
   * a page that says nothing would read as a plan that failed to print.
   */
  generateImprovementPlanPdf(
    reportId: string,
  ): Promise<ReportPdfResult | null>
}

export const IReportPdfService = Symbol('IReportPdfService')
