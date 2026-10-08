import { Test } from '@nestjs/testing'

import { INoticeDispatchService } from '@dmr.is/doe-modules/notice-dispatch'
import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { AdvisoryLockService } from '@dmr.is/shared-modules'

import { DOE_TASK_JOB_IDS, DOE_TASK_NAMESPACE } from '../constants'
import { NoticeOutboxTask } from './notice-outbox.task'

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

  beforeEach(async () => {
    jest.clearAllMocks()

    dispatchPending = jest.fn().mockResolvedValue({ picked: 0, settled: 0 })
    runWithDistributedLock = jest
      .fn()
      .mockImplementation(async (_ns, _id, work) => {
        await work()
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
})
