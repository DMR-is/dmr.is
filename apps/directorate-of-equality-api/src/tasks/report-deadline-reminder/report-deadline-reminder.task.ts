import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { AdvisoryLockService } from '@dmr.is/shared-modules'

import {
  DOE_TASK_JOB_IDS,
  DOE_TASK_NAMESPACE,
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
  async run(): Promise<void> {
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
