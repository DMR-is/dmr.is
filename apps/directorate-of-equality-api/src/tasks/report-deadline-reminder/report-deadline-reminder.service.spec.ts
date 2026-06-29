import { Op } from 'sequelize'

import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyStatusEnum } from '../../modules/company/models/company.enums'
import { CompanyModel } from '../../modules/company/models/company.model'
import {
  CompanyEventTypeEnum,
  CompanyReminderTierEnum,
} from '../../modules/company/models/company-event.model'
import { ICompanyEventService } from '../../modules/company-event/company-event.service.interface'
import { IDoeMailService } from '../../modules/mail/doe-mail.service.interface'
import { ReportTypeEnum } from '../../modules/report/models/report.enums'
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
    for (let i = 0; i < index; i++) findAll.mockResolvedValueOnce([])
    findAll.mockResolvedValueOnce([company])
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

    it('does not re-emit NO_EMAIL when one already exists for the tier', async () => {
      returnCompanyAtCall(CALL.equalitySixMonths, makeCompany({ email: null }))
      hasDeadlineReminderEvent.mockResolvedValue(true)

      await service.run()

      expect(sendReportDeadlineReminder).not.toHaveBeenCalled()
      expect(emitDeadlineReminderEvent).not.toHaveBeenCalled()
    })

    it('does not record the sent event when the email send fails', async () => {
      returnCompanyAtCall(CALL.equalitySixMonths, makeCompany())
      sendReportDeadlineReminder.mockRejectedValue(new Error('SES down'))

      await expect(service.run()).rejects.toThrow('SES down')

      expect(emitDeadlineReminderEvent).not.toHaveBeenCalled()
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
