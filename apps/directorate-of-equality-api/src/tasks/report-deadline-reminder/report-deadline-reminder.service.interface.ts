export interface IReportDeadlineReminderService {
  /**
   * Sends a reminder to every company whose next equality- or salary-report
   * deadline falls within the reminder window (6 months out) and that has not
   * already been reminded for that exact due date. Idempotent across runs.
   */
  run(): Promise<void>
}

export const IReportDeadlineReminderService = Symbol(
  'IReportDeadlineReminderService',
)
