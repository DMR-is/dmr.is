/**
 * A message this service could not hand to SES.
 *
 * ⚠️ **Exists so a caller can contain a bad recipient without also containing a
 * database fault.** `IDoeMailService.sendReportDeadlineReminder` throws on a
 * failed send by design — that is what keeps the failure out of the SENT event
 * so the next run retries it — and the deadline-reminder task catches per
 * company so one permanently bad address cannot withhold every other company's
 * statutory notice.
 *
 * A bare `Error` made that catch far too wide. The task runs inside one
 * transaction (`AdvisoryLockService.runWithDistributedLock`, with CLS live for
 * this app), so a DB error aborts the transaction: every later statement fails
 * `25P02`, the same catch swallows each one, and Postgres answers the eventual
 * `COMMIT` on an aborted transaction with a silent `ROLLBACK`. The task then
 * reports success while every `SENT` event and the `job_runs` cooldown are
 * discarded — and the next run re-mails every company it just mailed. Mail was
 * still being sent throughout, so the storm is bounded by nothing.
 *
 * Catching this type and rethrowing everything else keeps the containment on the
 * failure it was written for.
 */
export class MailSendError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'MailSendError'
  }
}
