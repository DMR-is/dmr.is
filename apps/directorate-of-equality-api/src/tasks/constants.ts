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
  reportDraftPrune: 2,
} as const

export const REPORT_DEADLINE_REMINDER_LOGGING_CONTEXT =
  'ReportDeadlineReminderTask'

export const REPORT_DRAFT_PRUNE_LOGGING_CONTEXT = 'ReportDraftPruneTask'

/** Abandoned drafts untouched for this long are reaped by the prune task. */
export const DRAFT_PRUNE_AGE_MONTHS = 6

/**
 * Master switch for the daily automated reminder emails
 * (`ReportDeadlineReminderTask`).
 *
 * Strict opt-in: the job only runs when `EMAIL_REMINDER_JOB_ENABLED` is
 * exactly `'true'`, so an unset or malformed value leaves outbound reminder
 * email off rather than mailing every company with a due deadline. The var has
 * to be set in any environment that is meant to actually send.
 *
 * Read at call time rather than module load so the flag is testable and a
 * restart is the only thing needed to flip it.
 */
export const isEmailReminderJobEnabled = (): boolean =>
  process.env.EMAIL_REMINDER_JOB_ENABLED === 'true'
