import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { AdvisoryLockService } from '@dmr.is/shared-modules'

import {
  DOE_TASK_JOB_IDS,
  DOE_TASK_NAMESPACE,
  isEmailReminderJobEnabled,
  REPORT_DEADLINE_REMINDER_LOGGING_CONTEXT,
} from '../constants'
import { IReportDeadlineReminderService } from './report-deadline-reminder.service.interface'

const LOGGING_CONTEXT = REPORT_DEADLINE_REMINDER_LOGGING_CONTEXT

// Daily in production; hourly in dev to make the task easy to observe.
const CRON_EXPRESSION =
  process.env.NODE_ENV === 'production'
    ? CronExpression.EVERY_DAY_AT_6AM
    : CronExpression.EVERY_HOUR

@Injectable()
export class ReportDeadlineReminderTask {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(AdvisoryLockService)
    private readonly advisoryLockService: AdvisoryLockService,
    @Inject(IReportDeadlineReminderService)
    private readonly reminderService: IReportDeadlineReminderService,
  ) {}

  @Cron(CRON_EXPRESSION, {
    timeZone: 'Atlantic/Reykjavik',
    name: 'report-deadline-reminder-task',
  })
  /**
   * ⚠️ **Everything is caught here, because a throw out of this method exits the
   * container.**
   *
   * `@Cron` registers an `async` callback that cron does not await
   * (`waitForCompletion` is not set), so a rejection reaches neither cron's own
   * try/catch nor its `errorHandler` — it becomes an `unhandledRejection`. This
   * repo's winston setup installs `rejectionHandlers` with `exitOnError`, so the
   * process exits 1 and ECS restarts the API. While the underlying fault
   * persists, that repeats every run.
   *
   * `ReportDeadlineReminderService.processTier` rethrows anything that is not a
   * `MailSendError` on purpose — a database fault must abort the run rather than
   * mail on with nothing recorded — and this boundary is what makes "abort the
   * run" mean the run. Pre-existing exposure, not introduced by that rethrow:
   * before it, `processTier` had no catch at all and every error here already
   * exited the process. Legal Gazette's `issues.task.ts` still has the unguarded
   * shape.
   */
  async run(): Promise<void> {
    try {
      await this.runOnce()
    } catch (error) {
      this.logger.error(
        'Report deadline reminder task failed — aborting this run',
        {
          context: LOGGING_CONTEXT,
          message: error instanceof Error ? error.message : String(error),
        },
      )
    }
  }

  private async runOnce(): Promise<void> {
    // Nothing goes out unless the environment opts in explicitly.
    if (!isEmailReminderJobEnabled()) {
      this.logger.debug(
        'Skipped report deadline reminder task: EMAIL_REMINDER_JOB_ENABLED is not "true"',
        { context: LOGGING_CONTEXT },
      )
      return
    }

    // One container does the work per run; the rest see the held lock or the
    // cooldown. 12h cooldown comfortably covers a once-a-day schedule.
    const { ran, reason } = await this.advisoryLockService.runWithDistributedLock(
      DOE_TASK_NAMESPACE,
      DOE_TASK_JOB_IDS.reportDeadlineReminder,
      () => this.reminderService.run(),
      {
        cooldownMs: 12 * 60 * 60 * 1000,
        containerId: 'report-deadline-reminder',
      },
    )

    if (!ran) {
      this.logger.debug(
        `Skipped report deadline reminder task: ${reason}`,
        { context: LOGGING_CONTEXT },
      )
    }
  }
}
