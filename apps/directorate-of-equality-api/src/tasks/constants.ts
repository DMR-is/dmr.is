/**
 * Constants for DoE scheduled tasks.
 *
 * Tasks run on every API container, so each guards its work with a Postgres
 * advisory lock (AdvisoryLockService from @dmr.is/shared-modules) scoped by
 * `DOE_TASK_NAMESPACE` + a per-task key from `DOE_TASK_JOB_IDS`.
 */

/** Advisory-lock namespace for all DoE tasks. Unique within the DoE database. */
export const DOE_TASK_NAMESPACE = 3010

/** Per-task lock keys. Each must be unique within the namespace. */
export const DOE_TASK_JOB_IDS = {
  reportDeadlineReminder: 1,
} as const

/** How far before a deadline the reminder is sent. */
export const REPORT_DEADLINE_REMINDER_MONTHS = 6

export const REPORT_DEADLINE_REMINDER_LOGGING_CONTEXT =
  'ReportDeadlineReminderTask'
