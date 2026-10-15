import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { IMailboxDeliveryService } from '@dmr.is/doe-modules/mailbox-delivery'
import { INoticeDispatchService } from '@dmr.is/doe-modules/notice-dispatch'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { AdvisoryLockService } from '@dmr.is/shared-modules'

import {
  DOE_TASK_JOB_IDS,
  DOE_TASK_NAMESPACE,
  NOTICE_OUTBOX_LOGGING_CONTEXT,
} from '../constants'

const LOGGING_CONTEXT = NOTICE_OUTBOX_LOGGING_CONTEXT

/** Deliveries named in one alert line; the count covers the rest. */
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
   * Names, at error level, every mailbox delivery a person must act on:
   * UNCERTAIN, interrupted mid-call, or out of attempts. Nothing else tells
   * anyone. The dispatcher gives its outbox row up as FAILED and moves on, and
   * a reminder only records a timeline event. See the mailbox-delivery
   * README's "Alerting".
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
          const stuck = await this.mailboxDeliveryService.findStuckDeliveries(
            MAILBOX_DELIVERY_ALERT_LIMIT,
          )
          if (stuck.length === 0) {
            return
          }

          const count = (reason: string) =>
            stuck.filter((delivery) => delivery.reason === reason).length

          this.logger.error(
            `Mailbox deliveries need a person: ${count('UNCERTAIN')} UNCERTAIN, ${count('INTERRUPTED')} interrupted, ${count('ATTEMPTS_EXHAUSTED')} out of attempts${stuck.length === MAILBOX_DELIVERY_ALERT_LIMIT ? ` (first ${MAILBOX_DELIVERY_ALERT_LIMIT} shown)` : ''}`,
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
}
