export interface IReportPdfDownloadGate {
  /**
   * Runs one applicant-facing PDF render inside the gate's concurrency limit,
   * waiting for a slot when all are taken. Answers 503 when the wait queue is
   * full too, without running `render`.
   *
   * Wrap the whole render, data reads included, and only after the caller is
   * authorized for the report.
   */
  run<T>(render: () => Promise<T>): Promise<T>
}

export const IReportPdfDownloadGate = Symbol('IReportPdfDownloadGate')
