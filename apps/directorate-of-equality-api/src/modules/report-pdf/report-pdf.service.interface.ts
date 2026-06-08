export interface IReportPdfService {
  /** Generates the salary-report ("Jafnlaunaúttekt") PDF as a binary buffer. */
  generateSalaryReportPdf(reportId: string): Promise<Buffer>

  /** Generates the equality-report ("Jafnréttisáætlun") PDF as a binary buffer. */
  generateEqualityReportPdf(reportId: string): Promise<Buffer>
}

export const IReportPdfService = Symbol('IReportPdfService')
