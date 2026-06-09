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
}

export const IReportPdfService = Symbol('IReportPdfService')
