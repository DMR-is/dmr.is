import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { INoticeDispatchService } from '@dmr.is/doe-modules/notice-dispatch'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { AdvisoryLockService } from '@dmr.is/shared-modules'

import {
  DOE_TASK_JOB_IDS,
  DOE_TASK_NAMESPACE,
  NOTICE_OUTBOX_LOGGING_CONTEXT,
} from '../constants'

const LOGGING_CONTEXT = NOTICE_OUTBOX_LOGGING_CONTEXT

/**
 * Sends the notices the outbox holds: approval and denial today, the
 * submission receipt and the mailbox channel later.
 *
 * Every minute, in every environment, and not behind a flag: the approval and
 * denial emails used to go out right after the reviewer's request, so anything
 * slower or switched off would delay or drop notices that already exist.
 *
 * Runs on every API container; the advisory lock lets one do the work. The
 * 30-second cooldown is shorter than the schedule, so it only absorbs two
 * containers firing a few seconds apart, never a real run.
 */
@Injectable()
export class NoticeOutboxTask {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(AdvisoryLockService)
    private readonly advisoryLockService: AdvisoryLockService,
    @Inject(INoticeDispatchService)
    private readonly noticeDispatchService: INoticeDispatchService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    timeZone: 'Atlantic/Reykjavik',
    name: 'notice-outbox-task',
  })
  /**
   * ⚠️ **Everything is caught here, because a throw out of this method exits the
   * container.** `@Cron` does not await this callback, so a rejection becomes an
   * `unhandledRejection`, which this repo's winston setup turns into an exit.
   * See `ReportDeadlineReminderTask.run`.
   */
  async run(): Promise<void> {
    try {
      const { ran, reason } =
        await this.advisoryLockService.runWithDistributedLock(
          DOE_TASK_NAMESPACE,
          DOE_TASK_JOB_IDS.noticeOutbox,
          async (lockTransaction) => {
            const { picked, settled } =
              await this.noticeDispatchService.dispatchPending(lockTransaction)

            if (picked > 0) {
              this.logger.info(
                `Notice outbox: ${settled} of ${picked} notices settled`,
                { context: LOGGING_CONTEXT, picked, settled },
              )
            }
          },
          {
            cooldownMs: 30 * 1000,
            containerId: 'notice-outbox',
          },
        )

      if (!ran) {
        this.logger.debug(`Skipped notice outbox task: ${reason}`, {
          context: LOGGING_CONTEXT,
        })
      }
    } catch (error) {
      this.logger.error('Notice outbox task failed — aborting this run', {
        context: LOGGING_CONTEXT,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }
}
