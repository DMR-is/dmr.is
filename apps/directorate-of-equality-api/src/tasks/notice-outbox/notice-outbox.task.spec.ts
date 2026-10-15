import { Test } from '@nestjs/testing'

import {
  IMailboxDeliveryService,
  MailboxDeliveryKindEnum,
} from '@dmr.is/doe-modules/mailbox-delivery'
import { INoticeDispatchService } from '@dmr.is/doe-modules/notice-dispatch'
import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { AdvisoryLockService } from '@dmr.is/shared-modules'

import { DOE_TASK_JOB_IDS, DOE_TASK_NAMESPACE } from '../constants'
import {
  MAILBOX_DELIVERY_ALERT_LIMIT,
  NoticeOutboxTask,
} from './notice-outbox.task'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('NoticeOutboxTask', () => {
  let task: NoticeOutboxTask
  let runWithDistributedLock: jest.Mock
  let dispatchPending: jest.Mock
  let findStuckDeliveries: jest.Mock
  const lockTransaction = { id: 'lock-tx' }

  beforeEach(async () => {
    jest.clearAllMocks()

    dispatchPending = jest.fn().mockResolvedValue({ picked: 0, settled: 0 })
    findStuckDeliveries = jest.fn().mockResolvedValue([])
    runWithDistributedLock = jest
      .fn()
      .mockImplementation(async (_ns, _id, work) => {
        await work(lockTransaction)
        return { ran: true }
      })

    const module = await Test.createTestingModule({
      providers: [
        NoticeOutboxTask,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: AdvisoryLockService,
          useValue: { runWithDistributedLock },
        },
        {
          provide: INoticeDispatchService,
          useValue: { dispatchPending },
        },
        {
          provide: IMailboxDeliveryService,
          useValue: { findStuckDeliveries },
        },
      ],
    }).compile()

    task = module.get(NoticeOutboxTask)
  })

  // No flag: approval and denial emails depend on this task running.
  it('dispatches under its own advisory lock, with no flag to turn it off', async () => {
    await task.run()

    expect(runWithDistributedLock).toHaveBeenCalledWith(
      DOE_TASK_NAMESPACE,
      DOE_TASK_JOB_IDS.noticeOutbox,
      expect.any(Function),
      expect.objectContaining({ containerId: 'notice-outbox' }),
    )
    expect(dispatchPending).toHaveBeenCalledTimes(1)
    // The dispatcher opens a savepoint per row on the lock's transaction.
    expect(dispatchPending).toHaveBeenCalledWith(lockTransaction)
  })

  it('does not dispatch when another container holds the lock', async () => {
    runWithDistributedLock.mockResolvedValue({
      ran: false,
      reason: 'lock_held',
    })

    await task.run()

    expect(dispatchPending).not.toHaveBeenCalled()
  })

  // A rejection out of a `@Cron` callback is an unhandled rejection, which
  // exits the container.
  it('catches a failed run instead of letting it escape', async () => {
    dispatchPending.mockRejectedValue(new Error('db is down'))

    await expect(task.run()).resolves.toBeUndefined()
    expect(mockLogger.error).toHaveBeenCalled()
  })

  describe('the stuck mailbox delivery alert', () => {
    const stuck = (deliveryId: string, reason: string) => ({
      deliveryId,
      kind: MailboxDeliveryKindEnum.SALARY_REPORT_APPROVED,
      companyId: 'company-1',
      reason,
      attempts: 5,
      lastAttemptAt: new Date('2026-10-14T10:00:00.000Z'),
    })

    it('names every delivery that needs a person, at error level, under its own lock', async () => {
      findStuckDeliveries.mockResolvedValue([
        stuck('d-1', 'UNCERTAIN'),
        stuck('d-2', 'ATTEMPTS_EXHAUSTED'),
        stuck('d-3', 'INTERRUPTED'),
      ])

      await task.alertStuckMailboxDeliveries()

      expect(runWithDistributedLock).toHaveBeenCalledWith(
        DOE_TASK_NAMESPACE,
        DOE_TASK_JOB_IDS.mailboxDeliveryAlert,
        expect.any(Function),
        expect.objectContaining({ containerId: 'mailbox-delivery-alert' }),
      )
      expect(findStuckDeliveries).toHaveBeenCalledWith(
        MAILBOX_DELIVERY_ALERT_LIMIT,
      )
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Mailbox deliveries need a person: 1 UNCERTAIN, 1 interrupted, 1 out of attempts',
        expect.objectContaining({
          deliveries: [
            expect.objectContaining({ deliveryId: 'd-1', reason: 'UNCERTAIN' }),
            expect.objectContaining({
              deliveryId: 'd-2',
              reason: 'ATTEMPTS_EXHAUSTED',
            }),
            expect.objectContaining({
              deliveryId: 'd-3',
              reason: 'INTERRUPTED',
            }),
          ],
        }),
      )
    })

    it('says nothing when no delivery is stuck', async () => {
      await task.alertStuckMailboxDeliveries()

      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('catches a failed run instead of letting it escape', async () => {
      findStuckDeliveries.mockRejectedValue(new Error('db is down'))

      await expect(task.alertStuckMailboxDeliveries()).resolves.toBeUndefined()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Mailbox delivery alert failed — aborting this run',
        expect.anything(),
      )
    })
  })
})
