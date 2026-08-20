import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { AdvisoryLockService } from '@dmr.is/shared-modules'

import { IReportDeadlineReminderService } from './report-deadline-reminder.service.interface'
import { ReportDeadlineReminderTask } from './report-deadline-reminder.task'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('ReportDeadlineReminderTask', () => {
  const originalFlag = process.env.EMAIL_REMINDER_JOB_ENABLED

  let task: ReportDeadlineReminderTask
  let runWithDistributedLock: jest.Mock
  let reminderRun: jest.Mock

  beforeEach(async () => {
    jest.clearAllMocks()
    delete process.env.EMAIL_REMINDER_JOB_ENABLED

    reminderRun = jest.fn().mockResolvedValue(undefined)
    // Stand-in for the advisory lock: always wins, so the only thing gating
    // the work in these tests is the env flag.
    runWithDistributedLock = jest
      .fn()
      .mockImplementation(async (_ns, _id, work) => {
        await work()
        return { ran: true }
      })

    const module = await Test.createTestingModule({
      providers: [
        ReportDeadlineReminderTask,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: AdvisoryLockService,
          useValue: { runWithDistributedLock },
        },
        {
          provide: IReportDeadlineReminderService,
          useValue: { run: reminderRun },
        },
      ],
    }).compile()

    task = module.get(ReportDeadlineReminderTask)
  })

  afterAll(() => {
    if (originalFlag === undefined) {
      delete process.env.EMAIL_REMINDER_JOB_ENABLED
    } else {
      process.env.EMAIL_REMINDER_JOB_ENABLED = originalFlag
    }
  })

  it('does not take the lock or send when EMAIL_REMINDER_JOB_ENABLED is unset', async () => {
    await task.run()

    expect(runWithDistributedLock).not.toHaveBeenCalled()
    expect(reminderRun).not.toHaveBeenCalled()
  })

  it.each(['false', 'TRUE', '1', ''])(
    'does not send when EMAIL_REMINDER_JOB_ENABLED is %p',
    async (value) => {
      process.env.EMAIL_REMINDER_JOB_ENABLED = value

      await task.run()

      expect(runWithDistributedLock).not.toHaveBeenCalled()
      expect(reminderRun).not.toHaveBeenCalled()
    },
  )

  it('runs the reminder service when EMAIL_REMINDER_JOB_ENABLED is "true"', async () => {
    process.env.EMAIL_REMINDER_JOB_ENABLED = 'true'

    await task.run()

    expect(runWithDistributedLock).toHaveBeenCalledTimes(1)
    expect(reminderRun).toHaveBeenCalledTimes(1)
  })
})
