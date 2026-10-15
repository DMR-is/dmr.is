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
  let countStuckDeliveries: jest.Mock
  let unconfiguredKinds: jest.Mock
  let findOverdueNotices: jest.Mock
  const lockTransaction = { id: 'lock-tx' }
  const originalEnabled = process.env.ONESYSTEMS_ENABLED

  const counts = (
    overrides: Partial<
      Record<'UNCERTAIN' | 'INTERRUPTED' | 'ATTEMPTS_EXHAUSTED', number>
    > = {},
  ) => ({ UNCERTAIN: 0, INTERRUPTED: 0, ATTEMPTS_EXHAUSTED: 0, ...overrides })

  afterAll(() => {
    if (originalEnabled === undefined) {
      delete process.env.ONESYSTEMS_ENABLED
    } else {
      process.env.ONESYSTEMS_ENABLED = originalEnabled
    }
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    delete process.env.ONESYSTEMS_ENABLED

    dispatchPending = jest.fn().mockResolvedValue({ picked: 0, settled: 0 })
    findStuckDeliveries = jest.fn().mockResolvedValue([])
    countStuckDeliveries = jest.fn().mockResolvedValue(counts())
    unconfiguredKinds = jest.fn().mockReturnValue([])
    findOverdueNotices = jest.fn().mockResolvedValue({ total: 0, notices: [] })
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
          useValue: { dispatchPending, findOverdueNotices },
        },
        {
          provide: IMailboxDeliveryService,
          useValue: {
            findStuckDeliveries,
            countStuckDeliveries,
            unconfiguredKinds,
          },
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
      countStuckDeliveries.mockResolvedValue(
        counts({ UNCERTAIN: 1, INTERRUPTED: 1, ATTEMPTS_EXHAUSTED: 1 }),
      )
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

    // The counts come from every row, not the capped list.
    it('counts every stuck delivery, past the ones it names', async () => {
      countStuckDeliveries.mockResolvedValue(counts({ UNCERTAIN: 70 }))
      findStuckDeliveries.mockResolvedValue(
        Array.from({ length: MAILBOX_DELIVERY_ALERT_LIMIT }, (_, i) =>
          stuck(`d-${i}`, 'UNCERTAIN'),
        ),
      )

      await task.alertStuckMailboxDeliveries()

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Mailbox deliveries need a person: 70 UNCERTAIN, 0 interrupted, 0 out of attempts (oldest ${MAILBOX_DELIVERY_ALERT_LIMIT} of 70 shown)`,
        expect.anything(),
      )
    })

    it('says nothing when nothing needs a person', async () => {
      process.env.ONESYSTEMS_ENABLED = 'true'

      await task.alertStuckMailboxDeliveries()

      expect(findStuckDeliveries).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('names every kind in use with no case template while the flag is on', async () => {
      process.env.ONESYSTEMS_ENABLED = 'true'
      unconfiguredKinds.mockReturnValue([
        MailboxDeliveryKindEnum.SALARY_REPORT_SUBMITTED,
        MailboxDeliveryKindEnum.EQUALITY_REPORT_DEADLINE_REMINDER,
      ])

      await task.alertStuckMailboxDeliveries()

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('2 mailbox kinds have no case template'),
        expect.objectContaining({
          kinds: [
            MailboxDeliveryKindEnum.SALARY_REPORT_SUBMITTED,
            MailboxDeliveryKindEnum.EQUALITY_REPORT_DEADLINE_REMINDER,
          ],
        }),
      )
    })

    it('says nothing of case templates while the flag is off', async () => {
      unconfiguredKinds.mockReturnValue([
        MailboxDeliveryKindEnum.SALARY_REPORT_SUBMITTED,
      ])

      await task.alertStuckMailboxDeliveries()

      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    // A decision held on a document One has filed but not sent, with the flag
    // off for good, is named here and nowhere else.
    it('names every overdue outbox row, with its reason', async () => {
      findOverdueNotices.mockResolvedValue({
        total: 2,
        notices: [
          {
            noticeId: 'n-1',
            kind: 'REPORT_APPROVED',
            reportId: 'r-1',
            attempts: 0,
            lastError: 'mailbox delivery d-1 has a document in One',
            createdAt: new Date('2026-10-14T10:00:00.000Z'),
          },
        ],
      })

      await task.alertStuckMailboxDeliveries()

      expect(findOverdueNotices).toHaveBeenCalledWith(
        MAILBOX_DELIVERY_ALERT_LIMIT,
      )
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Notice outbox: 2 notices overdue (oldest 1 shown)',
        expect.objectContaining({
          notices: [
            {
              noticeId: 'n-1',
              kind: 'REPORT_APPROVED',
              reportId: 'r-1',
              attempts: 0,
              lastError: 'mailbox delivery d-1 has a document in One',
            },
          ],
        }),
      )
    })

    it('catches a failed run instead of letting it escape', async () => {
      countStuckDeliveries.mockRejectedValue(new Error('db is down'))

      await expect(task.alertStuckMailboxDeliveries()).resolves.toBeUndefined()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Mailbox delivery alert failed — aborting this run',
        expect.anything(),
      )
    })
  })
})
