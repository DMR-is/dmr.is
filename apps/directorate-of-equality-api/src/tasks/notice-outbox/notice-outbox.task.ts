import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import {
  IMailboxDeliveryService,
  isMailboxDeliveryEnabled,
  StuckMailboxDeliveryReason,
} from '@dmr.is/doe-modules/mailbox-delivery'
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
 * Deliveries, and outbox rows, named in one alert line. The counts are taken
 * over every row, so they cover the rest.
 */
export const MAILBOX_DELIVERY_ALERT_LIMIT = 50

/**
 * Sends the notices the outbox holds: the submission receipt (mailbox only),
 * the approval and the denial. Also raises the daily alert for mailbox
 * deliveries that need a person, which the dispatcher's own rows give up on.
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
    @Inject(IMailboxDeliveryService)
    private readonly mailboxDeliveryService: IMailboxDeliveryService,
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

  @Cron(CronExpression.EVERY_DAY_AT_8AM, {
    timeZone: 'Atlantic/Reykjavik',
    name: 'mailbox-delivery-alert-task',
  })
  /**
   * Names, at error level, what a person must act on:
   * - every mailbox delivery that is UNCERTAIN, interrupted mid-call, or out
   *   of attempts. The dispatcher gives its outbox row up as FAILED and moves
   *   on, and a reminder only records a timeline event;
   * - with `ONESYSTEMS_ENABLED` on, every mailbox kind in use with no case
   *   template. Its notices are held and its reminders not sent until the
   *   template is set;
   * - every outbox row overdue (`findOverdueNotices`): held on a document One
   *   has filed but not sent while the flag is off, held on an unconfigured
   *   kind, or failing on every run.
   * Nothing else tells anyone. See the mailbox-delivery README's "Alerting".
   *
   * Daily, so a stuck delivery is raised every morning until it is settled,
   * and not behind `ONESYSTEMS_ENABLED`: rows left from before the flag went
   * off still need a person. Caught like `run`, for the same reason.
   */
  async alertStuckMailboxDeliveries(): Promise<void> {
    try {
      await this.advisoryLockService.runWithDistributedLock(
        DOE_TASK_NAMESPACE,
        DOE_TASK_JOB_IDS.mailboxDeliveryAlert,
        async () => {
          await this.alertStuckDeliveries()
          this.alertUnconfiguredKinds()
          await this.alertOverdueNotices()
        },
        {
          // Long enough to absorb every container's 08:00 firing, far
          // shorter than the day between runs.
          cooldownMs: 60 * 60 * 1000,
          containerId: 'mailbox-delivery-alert',
        },
      )
    } catch (error) {
      this.logger.error('Mailbox delivery alert failed — aborting this run', {
        context: LOGGING_CONTEXT,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  private async alertStuckDeliveries(): Promise<void> {
    const counts = await this.mailboxDeliveryService.countStuckDeliveries()
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
    if (total === 0) {
      return
    }

    const stuck = await this.mailboxDeliveryService.findStuckDeliveries(
      MAILBOX_DELIVERY_ALERT_LIMIT,
    )
    const count = (reason: StuckMailboxDeliveryReason) => counts[reason]

    this.logger.error(
      `Mailbox deliveries need a person: ${count('UNCERTAIN')} UNCERTAIN, ${count('INTERRUPTED')} interrupted, ${count('ATTEMPTS_EXHAUSTED')} out of attempts${total > stuck.length ? ` (oldest ${stuck.length} of ${total} shown)` : ''}`,
      {
        context: LOGGING_CONTEXT,
        deliveries: stuck.map((delivery) => ({
          deliveryId: delivery.deliveryId,
          kind: delivery.kind,
          reason: delivery.reason,
          attempts: delivery.attempts,
        })),
      },
    )
  }

  /** Only while the flag is on: with it off, no kind is used. */
  private alertUnconfiguredKinds(): void {
    if (!isMailboxDeliveryEnabled()) {
      return
    }

    const kinds = this.mailboxDeliveryService.unconfiguredKinds()
    if (kinds.length === 0) {
      return
    }

    this.logger.error(
      `ONESYSTEMS_ENABLED is on but ${kinds.length} mailbox kinds have no case template: their notices are held and their reminders not sent`,
      { context: LOGGING_CONTEXT, kinds },
    )
  }

  private async alertOverdueNotices(): Promise<void> {
    const { total, notices } =
      await this.noticeDispatchService.findOverdueNotices(
        MAILBOX_DELIVERY_ALERT_LIMIT,
      )
    if (total === 0) {
      return
    }

    this.logger.error(
      `Notice outbox: ${total} notices overdue${total > notices.length ? ` (oldest ${notices.length} shown)` : ''}`,
      {
        context: LOGGING_CONTEXT,
        notices: notices.map((notice) => ({
          noticeId: notice.noticeId,
          kind: notice.kind,
          reportId: notice.reportId,
          attempts: notice.attempts,
          lastError: notice.lastError,
        })),
      },
    )
  }
}
