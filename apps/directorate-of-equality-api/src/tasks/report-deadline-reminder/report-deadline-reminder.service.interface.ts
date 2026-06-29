export interface IReportDeadlineReminderService {
  /**
   * Sends deadline reminders for every company's next equality- and salary-
   * report deadline at four milestones — 6 months, 2 months, 2 weeks before,
   * and on/after the due date — emitting one audit event per (report kind,
   * tier, due date). Idempotent across runs and containers.
   */
  run(): Promise<void>
}

export const IReportDeadlineReminderService = Symbol(
  'IReportDeadlineReminderService',
)
