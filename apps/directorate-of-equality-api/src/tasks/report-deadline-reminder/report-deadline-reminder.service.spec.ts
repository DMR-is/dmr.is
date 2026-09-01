import { Op } from 'sequelize'

import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import {
  CompanyEventTypeEnum,
  CompanyModel,
  CompanyReminderTierEnum,
  CompanyStatusEnum,
} from '@dmr.is/doe-modules/company'
import { ICompanyEventService } from '@dmr.is/doe-modules/company-event'
import { IDoeMailService, MailSendError } from '@dmr.is/doe-modules/mail'
import { ReportTypeEnum } from '@dmr.is/doe-modules/report'
import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { ReportDeadlineReminderService } from './report-deadline-reminder.service'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mirror of the service's private date helpers, used to compute expected band
// boundaries from the same fixed `now`.
const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const EQUALITY_DUE = new Date('2026-12-01T00:00:00.000Z')
const SALARY_DUE = new Date('2027-01-15T00:00:00.000Z')

type CompanyOverrides = Partial<{
  id: string
  name: string
  email: string | null
  status: CompanyStatusEnum
  nextEqualityReportDueAt: Date | null
  nextSalaryReportDueAt: Date | null
}>

const makeCompany = (overrides: CompanyOverrides = {}) =>
  ({
    id: 'company-1',
    name: 'Acme ehf.',
    email: 'acme@acme.is',
    status: CompanyStatusEnum.ACTIVE,
    nextEqualityReportDueAt: EQUALITY_DUE,
    nextSalaryReportDueAt: SALARY_DUE,
    ...overrides,
  }) as unknown as CompanyModel

describe('ReportDeadlineReminderService', () => {
  let service: ReportDeadlineReminderService
  let findAll: jest.Mock
  let hasDeadlineReminderEvent: jest.Mock
  let emitDeadlineReminderEvent: jest.Mock
  let sendReportDeadlineReminder: jest.Mock

  beforeEach(async () => {
    findAll = jest.fn().mockResolvedValue([])
    hasDeadlineReminderEvent = jest.fn().mockResolvedValue(false)
    emitDeadlineReminderEvent = jest.fn().mockResolvedValue(undefined)
    sendReportDeadlineReminder = jest.fn().mockResolvedValue(undefined)

    const module = await Test.createTestingModule({
      providers: [
        ReportDeadlineReminderService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: getModelToken(CompanyModel), useValue: { findAll } },
        {
          provide: ICompanyEventService,
          useValue: { hasDeadlineReminderEvent, emitDeadlineReminderEvent },
        },
        {
          provide: IDoeMailService,
          useValue: { sendReportDeadlineReminder },
        },
      ],
    }).compile()

    service = module.get(ReportDeadlineReminderService)
  })

  // The run iterates kinds [equality, salary] × tiers [6mo, 2mo, 2wk, due], so
  // findAll is called in this fixed order. These helpers make the per-call
  // arrangement in the behaviour tests readable.
  const CALL = {
    equalitySixMonths: 0,
    equalityTwoMonths: 1,
    equalityTwoWeeks: 2,
    equalityDue: 3,
    salarySixMonths: 4,
  }

  const returnCompanyAtCall = (index: number, company: CompanyModel) => {
    returnCompaniesAtCall(index, [company])
  }

  /** Same, for a band holding more than one company. */
  const returnCompaniesAtCall = (index: number, companies: CompanyModel[]) => {
    for (let i = 0; i < index; i++) findAll.mockResolvedValueOnce([])
    findAll.mockResolvedValueOnce(companies)
  }

  describe('run – band selection', () => {
    const base = new Date('2026-06-15T12:00:00.000Z')

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(base)
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('queries all four tiers for both report kinds, excluding inactive/quarantined', async () => {
      await service.run()

      expect(findAll).toHaveBeenCalledTimes(8)

      for (const call of findAll.mock.calls) {
        const where = call[0].where
        expect(where.status).toBe(CompanyStatusEnum.ACTIVE)
        expect(where.quarantined).toBe(false)
      }
    })

    it('builds contiguous, non-overlapping bands per tier', async () => {
      await service.run()

      const where = (i: number) => findAll.mock.calls[i][0].where

      // Equality: 6mo / 2mo / 2wk / due
      const sixMo = where(0).nextEqualityReportDueAt
      expect(sixMo[Op.gt].getTime()).toBe(addMonths(base, 2).getTime())
      expect(sixMo[Op.lte].getTime()).toBe(addMonths(base, 6).getTime())

      const twoMo = where(1).nextEqualityReportDueAt
      expect(twoMo[Op.gt].getTime()).toBe(addDays(base, 14).getTime())
      expect(twoMo[Op.lte].getTime()).toBe(addMonths(base, 2).getTime())

      const twoWk = where(2).nextEqualityReportDueAt
      expect(twoWk[Op.gt].getTime()).toBe(base.getTime())
      expect(twoWk[Op.lte].getTime()).toBe(addDays(base, 14).getTime())

      // DUE is floored 30 days back so old overdue deadlines are left alone.
      const due = where(3).nextEqualityReportDueAt
      expect(due[Op.gt].getTime()).toBe(addDays(base, -30).getTime())
      expect(due[Op.lte].getTime()).toBe(base.getTime())

      // Adjacent bands share their boundary (no gap, no overlap).
      expect(twoWk[Op.lte].getTime()).toBe(twoMo[Op.gt].getTime())
      expect(twoMo[Op.lte].getTime()).toBe(sixMo[Op.gt].getTime())

      // Salary tiers read the salary due column.
      expect(where(4).nextSalaryReportDueAt).toBeDefined()
      expect(where(4).nextEqualityReportDueAt).toBeUndefined()
    })
  })

  describe('run – reminder behaviour', () => {
    it('sends the reminder and records the tier-specific sent event', async () => {
      returnCompanyAtCall(CALL.equalitySixMonths, makeCompany())

      await service.run()

      expect(sendReportDeadlineReminder).toHaveBeenCalledTimes(1)
      expect(sendReportDeadlineReminder).toHaveBeenCalledWith('acme@acme.is', {
        companyName: 'Acme ehf.',
        reportType: ReportTypeEnum.EQUALITY,
        tier: CompanyReminderTierEnum.SIX_MONTHS,
        dueDate: EQUALITY_DUE,
      })
      expect(emitDeadlineReminderEvent).toHaveBeenCalledWith(
        'company-1',
        CompanyStatusEnum.ACTIVE,
        CompanyEventTypeEnum.EQUALITY_REPORT_DEADLINE_REMINDER_SENT,
        CompanyReminderTierEnum.SIX_MONTHS,
        EQUALITY_DUE.toISOString(),
      )
    })

    it('skips a company already reminded for that tier and due date', async () => {
      returnCompanyAtCall(CALL.equalitySixMonths, makeCompany())
      hasDeadlineReminderEvent.mockResolvedValue(true)

      await service.run()

      expect(sendReportDeadlineReminder).not.toHaveBeenCalled()
      expect(emitDeadlineReminderEvent).not.toHaveBeenCalled()
    })

    it('checks dedup against the exact tier being processed', async () => {
      returnCompanyAtCall(CALL.equalitySixMonths, makeCompany())

      await service.run()

      expect(hasDeadlineReminderEvent).toHaveBeenCalledWith(
        'company-1',
        CompanyEventTypeEnum.EQUALITY_REPORT_DEADLINE_REMINDER_SENT,
        CompanyReminderTierEnum.SIX_MONTHS,
        EQUALITY_DUE.toISOString(),
      )
    })

    it('records a NO_EMAIL event instead of sending when no email is on file', async () => {
      returnCompanyAtCall(CALL.equalitySixMonths, makeCompany({ email: null }))

      await service.run()

      expect(sendReportDeadlineReminder).not.toHaveBeenCalled()
      expect(emitDeadlineReminderEvent).toHaveBeenCalledWith(
        'company-1',
        CompanyStatusEnum.ACTIVE,
        CompanyEventTypeEnum.EQUALITY_REPORT_DEADLINE_REMINDER_NO_EMAIL,
        CompanyReminderTierEnum.SIX_MONTHS,
        EQUALITY_DUE.toISOString(),
      )
    })

    /*
     * ⚠️ **A stored value that cannot be mailed is the same finding as none.**
     *
     * `company.email` is admin-set, nullable and validated by nothing. A
     * truthy-but-unusable value used to sail past the old `if (!to)` into a send
     * that could never succeed — and because the `SENT` event is written only
     * after a successful send and `flagMissingEmail` was skipped, that company
     * got NO event of either kind. Silently retried every run, forever, with
     * nothing on its timeline for an admin to notice.
     *
     * Same rule as the report mail now (`looksLikeOneAddress`). Revert to
     * `if (!to)` and every case here fails.
     */
    it.each([
      ['whitespace only', '   '],
      ['a missing at-sign', 'acme.acme.is'],
      ['a comma-separated list', 'a@acme.is, b@acme.is'],
      ['an angle-bracketed display name', 'Acme <acme@acme.is>'],
    ])(
      'records NO_EMAIL instead of sending when the address is %s',
      async (_label, email) => {
        returnCompanyAtCall(CALL.equalitySixMonths, makeCompany({ email }))

        await service.run()

        expect(sendReportDeadlineReminder).not.toHaveBeenCalled()
        expect(emitDeadlineReminderEvent).toHaveBeenCalledWith(
          'company-1',
          CompanyStatusEnum.ACTIVE,
          CompanyEventTypeEnum.EQUALITY_REPORT_DEADLINE_REMINDER_NO_EMAIL,
          CompanyReminderTierEnum.SIX_MONTHS,
          EQUALITY_DUE.toISOString(),
        )
      },
    )

    it('trims a padded address rather than treating it as unusable', async () => {
      returnCompanyAtCall(
        CALL.equalitySixMonths,
        makeCompany({ email: '  acme@acme.is  ' }),
      )

      await service.run()

      expect(sendReportDeadlineReminder).toHaveBeenCalledWith(
        'acme@acme.is',
        expect.anything(),
      )
    })

    it('does not re-emit NO_EMAIL when one already exists for the tier', async () => {
      returnCompanyAtCall(CALL.equalitySixMonths, makeCompany({ email: null }))
      hasDeadlineReminderEvent.mockResolvedValue(true)

      await service.run()

      expect(sendReportDeadlineReminder).not.toHaveBeenCalled()
      expect(emitDeadlineReminderEvent).not.toHaveBeenCalled()
    })

    /**
     * ⚠️ This used to assert `rejects.toThrow('SES down')`. That was written when
     * `sendReportDeadlineReminder` could not throw at all, so once the send
     * genuinely started throwing the assertion certified a whole-task outage
     * instead of catching it: one bad recipient aborted every remaining company,
     * tier and report kind, and rolled back the `job_runs` row.
     *
     * The contract is unchanged — a throw still means "not sent", so no SENT
     * event and a retry next run — but it is now contained per company.
     *
     * ⚠️ A `MailSendError`, which is what the real service throws, NOT a bare
     * Error: containment keys on the type. See the DB-error test below for why.
     */
    it('keeps going when one company\'s email send fails', async () => {
      returnCompanyAtCall(CALL.equalitySixMonths, makeCompany())
      sendReportDeadlineReminder.mockRejectedValue(new MailSendError('SES down'))

      await expect(service.run()).resolves.toBeUndefined()

      // Not recorded, so the next run retries this company.
      expect(emitDeadlineReminderEvent).not.toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalled()
    })

    // The actual regression guard: a failure must not swallow the companies
    // behind it. Two companies in the same band, the first one failing.
    it('reminds the companies after one that failed', async () => {
      returnCompaniesAtCall(CALL.equalitySixMonths, [
        makeCompany({ id: 'company-bad' }),
        makeCompany({ id: 'company-good' }),
      ])
      sendReportDeadlineReminder
        .mockRejectedValueOnce(new MailSendError('SES down'))
        .mockResolvedValue(undefined)

      await expect(service.run()).resolves.toBeUndefined()

      expect(sendReportDeadlineReminder).toHaveBeenCalledTimes(2)
      expect(emitDeadlineReminderEvent).toHaveBeenCalledTimes(1)
      expect(emitDeadlineReminderEvent).toHaveBeenCalledWith(
        'company-good',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      )
    })

    /*
     * ⚠️ **The other half of the containment, and the reason it is typed.**
     *
     * `AdvisoryLockService` runs this whole task inside one transaction and CLS
     * is live for this app, so every query here enlists in it. A DB error
     * therefore aborts the transaction: if the catch were blanket, each later
     * statement would fail `25P02` and be swallowed the same way, the loop would
     * keep calling SES for every remaining company, and Postgres would answer
     * the eventual COMMIT on an aborted transaction with a silent ROLLBACK. The
     * task would report success having mailed everyone while every SENT event
     * and the `job_runs` cooldown were discarded — and the next run would mail
     * them all again.
     *
     * So anything that is not a mail failure has to come back out. Widen the
     * catch to `catch (error)` and this test fails.
     */
    it('aborts loudly when the event write fails, rather than mailing on', async () => {
      returnCompaniesAtCall(CALL.equalitySixMonths, [
        makeCompany({ id: 'company-1' }),
        makeCompany({ id: 'company-2' }),
      ])
      emitDeadlineReminderEvent.mockRejectedValue(
        new Error('column does not exist'),
      )

      await expect(service.run()).rejects.toThrow('column does not exist')

      // Stopped at the first company instead of mailing the rest with nothing
      // durable recorded.
      expect(sendReportDeadlineReminder).toHaveBeenCalledTimes(1)
    })

    it('uses the salary event type and column for the salary kind', async () => {
      returnCompanyAtCall(
        CALL.salarySixMonths,
        makeCompany({ nextEqualityReportDueAt: null }),
      )

      await service.run()

      expect(sendReportDeadlineReminder).toHaveBeenCalledWith('acme@acme.is', {
        companyName: 'Acme ehf.',
        reportType: ReportTypeEnum.SALARY,
        tier: CompanyReminderTierEnum.SIX_MONTHS,
        dueDate: SALARY_DUE,
      })
      expect(emitDeadlineReminderEvent).toHaveBeenCalledWith(
        'company-1',
        CompanyStatusEnum.ACTIVE,
        CompanyEventTypeEnum.SALARY_REPORT_DEADLINE_REMINDER_SENT,
        CompanyReminderTierEnum.SIX_MONTHS,
        SALARY_DUE.toISOString(),
      )
    })

    it('skips a company whose due date for the kind is null', async () => {
      returnCompanyAtCall(
        CALL.equalitySixMonths,
        makeCompany({ nextEqualityReportDueAt: null }),
      )

      await service.run()

      expect(hasDeadlineReminderEvent).not.toHaveBeenCalled()
      expect(sendReportDeadlineReminder).not.toHaveBeenCalled()
    })
  })
})
