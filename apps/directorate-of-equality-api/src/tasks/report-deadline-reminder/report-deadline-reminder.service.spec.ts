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
import { INoticePdfService } from '../../modules/postholf/notice-pdf.service.interface'
import { INoticeStoreService } from '../../modules/postholf/notice-store.service.interface'
import { IPostholfService } from '../../modules/postholf/postholf.service.interface'
import { ReportTypeEnum } from '../../modules/report/models/report.enums'
import {
  ReportDeadlineReminderService,
  TIER_OFFSETS_FOR_TEST,
} from './report-deadline-reminder.service'

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
  nationalId: string
  address: string | null
  email: string | null
  status: CompanyStatusEnum
  nextEqualityReportDueAt: Date | null
  nextSalaryReportDueAt: Date | null
}>

const makeCompany = (overrides: CompanyOverrides = {}) =>
  ({
    id: 'company-1',
    name: 'Acme ehf.',
    // Not a real kennitala — `disallow-kennitalas` forbids valid ones in source,
    // and nothing here validates the checksum.
    nationalId: '5501234567',
    address: 'Einhversstaðir 1',
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
  let wantsPaper: jest.Mock
  let registerNotice: jest.Mock
  let renderNotice: jest.Mock
  let putNotice: jest.Mock

  beforeEach(async () => {
    findAll = jest.fn().mockResolvedValue([])
    hasDeadlineReminderEvent = jest.fn().mockResolvedValue(false)
    emitDeadlineReminderEvent = jest.fn().mockResolvedValue(undefined)
    sendReportDeadlineReminder = jest.fn().mockResolvedValue(undefined)
    wantsPaper = jest.fn().mockResolvedValue(false)
    registerNotice = jest
      .fn()
      .mockResolvedValue({ success: true, errors: [], wantsPaper: false })
    renderNotice = jest.fn().mockResolvedValue(Buffer.from('pdf'))
    putNotice = jest.fn().mockResolvedValue(undefined)

    // The mailbox tiers are opt-in on two separate switches. Every test in this
    // file starts with both cleared, so the email-tier expectations describe the
    // same behaviour they did before mailbox delivery existed.
    delete process.env.POSTHOLF_GO_LIVE_DATE
    delete process.env.POSTHOLF_ENABLED
    delete process.env.POSTHOLF_DOCUMENT_ID_SECRET

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
        {
          provide: IPostholfService,
          useValue: { wantsPaper, registerNotice },
        },
        { provide: INoticePdfService, useValue: { render: renderNotice } },
        { provide: INoticeStoreService, useValue: { put: putNotice } },
      ],
    }).compile()

    service = module.get(ReportDeadlineReminderService)
  })

  // The run iterates kinds [equality, salary] × tiers
  // [6mo, 2mo, 2wk, due, OVERDUE_NOTICE, FINES_PRECURSOR]. The two mailbox tiers
  // return before querying while POSTHOLF_GO_LIVE_DATE is unset, so with the
  // default arrangement above findAll is still called in this fixed order — which
  // is why these indices are unchanged from before the mailbox tiers existed.
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

    it('queries the four email tiers for both report kinds, excluding inactive/quarantined', async () => {
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

    it('does not query the mailbox tiers while POSTHOLF_GO_LIVE_DATE is unset', async () => {
      await service.run()

      // 8, not 12: the two mailbox tiers return before touching the database.
      // Without the go-live gate their bands reach back indefinitely, so the
      // first run after a deploy would serve a legal notice to the whole
      // existing overdue backlog.
      expect(findAll).toHaveBeenCalledTimes(8)
    })

    it('queries the mailbox tiers once POSTHOLF_GO_LIVE_DATE is set', async () => {
      process.env.POSTHOLF_GO_LIVE_DATE = '2026-01-01'

      await service.run()

      // The canary for the test above: the 8 must be reachable as 12, otherwise
      // that assertion would pass even if the tiers had been dropped entirely.
      expect(findAll).toHaveBeenCalledTimes(12)
    })

    it('bounds the mailbox bands below DUE, flooring both at the go-live date', async () => {
      process.env.POSTHOLF_GO_LIVE_DATE = '2026-01-01'
      const goLive = new Date('2026-01-01')

      await service.run()

      const where = (i: number) => findAll.mock.calls[i][0].where
      const { OVERDUE_NOTICE_AFTER_DAYS, FINES_PRECURSOR_AFTER_DAYS } =
        TIER_OFFSETS_FOR_TEST

      const due = where(3).nextEqualityReportDueAt
      const overdue = where(4).nextEqualityReportDueAt
      const precursor = where(5).nextEqualityReportDueAt

      // OVERDUE_NOTICE takes over exactly where DUE's floor is — a split of the
      // old floor, not a raising of it. Raising it would have let DUE swallow
      // both new bands so they never fired.
      expect(overdue[Op.lte].getTime()).toBe(
        addDays(base, -OVERDUE_NOTICE_AFTER_DAYS).getTime(),
      )
      expect(overdue[Op.lte].getTime()).toBe(due[Op.gt].getTime())
      expect(overdue[Op.gt].getTime()).toBe(
        addDays(base, -FINES_PRECURSOR_AFTER_DAYS).getTime(),
      )

      // The terminal tier has no floor of its own — only the go-live gate — so a
      // company far enough past due still reaches the legal-referral step.
      expect(precursor[Op.lte].getTime()).toBe(
        addDays(base, -FINES_PRECURSOR_AFTER_DAYS).getTime(),
      )
      expect(precursor[Op.gt]).toBeUndefined()

      expect(overdue[Op.gte].getTime()).toBe(goLive.getTime())
      expect(precursor[Op.gte].getTime()).toBe(goLive.getTime())
    })

    it('keeps the mailbox offsets ordered', () => {
      const { OVERDUE_NOTICE_AFTER_DAYS, FINES_PRECURSOR_AFTER_DAYS } =
        TIER_OFFSETS_FOR_TEST

      // Áminning must precede Undanfari, or the bands invert and the referral
      // notice fires before the reminder it is supposed to follow.
      expect(FINES_PRECURSOR_AFTER_DAYS).toBeGreaterThan(
        OVERDUE_NOTICE_AFTER_DAYS,
      )
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
  describe('run – mailbox notices', () => {
    const base = new Date('2026-06-15T12:00:00.000Z')
    // 45 days before `base`: inside the OVERDUE_NOTICE band for the default
    // offsets (30, 60), and after the go-live date below.
    const OVERDUE_DUE = new Date('2026-05-01T00:00:00.000Z')

    // Order with the mailbox tiers active:
    //   0..3 equality email, 4 equality OVERDUE, 5 equality FINES, 6.. salary
    const MAILBOX_CALL = { equalityOverdue: 4 }

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(base)
      process.env.POSTHOLF_GO_LIVE_DATE = '2026-01-01'
      process.env.POSTHOLF_ENABLED = 'true'
      process.env.POSTHOLF_DOCUMENT_ID_SECRET = 'test-secret'
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    const overdueCompany = () =>
      makeCompany({
        nextEqualityReportDueAt: OVERDUE_DUE,
        nextSalaryReportDueAt: null,
        email: null,
      })

    it('renders, stores, registers and records — in that order', async () => {
      const order: string[] = []
      renderNotice.mockImplementation(async () => {
        order.push('render')
        return Buffer.from('pdf')
      })
      putNotice.mockImplementation(async () => {
        order.push('store')
      })
      registerNotice.mockImplementation(async () => {
        order.push('register')
        return { success: true, errors: [], wantsPaper: false }
      })
      emitDeadlineReminderEvent.mockImplementation(async () => {
        order.push('event')
      })

      returnCompanyAtCall(MAILBOX_CALL.equalityOverdue, overdueCompany())

      await service.run()

      // The event is last on purpose: its existence is what the Skjalaveita
      // callback treats as "stored and announced".
      expect(order).toEqual(['render', 'store', 'register', 'event'])
    })

    it('sends no email and needs none — the company has no address on file', async () => {
      returnCompanyAtCall(MAILBOX_CALL.equalityOverdue, overdueCompany())

      await service.run()

      expect(sendReportDeadlineReminder).not.toHaveBeenCalled()
      expect(registerNotice).toHaveBeenCalledTimes(1)
      // No NO_EMAIL event either: mailbox delivery keys off nationalId, which is
      // NOT NULL, so the missing-contact-details outcome cannot arise.
      expect(emitDeadlineReminderEvent).toHaveBeenCalledTimes(1)
      expect(emitDeadlineReminderEvent).toHaveBeenCalledWith(
        'company-1',
        CompanyStatusEnum.ACTIVE,
        CompanyEventTypeEnum.EQUALITY_MAILBOX_NOTICE_SENT,
        CompanyReminderTierEnum.OVERDUE_NOTICE,
        OVERDUE_DUE.toISOString(),
      )
    })

    it('passes a documentId derived from the company, kind, tier and due date', async () => {
      returnCompanyAtCall(MAILBOX_CALL.equalityOverdue, overdueCompany())

      await service.run()

      const { documentId } = registerNotice.mock.calls[0][0]
      expect(documentId).toMatch(/^DOE-EQOV-20260501-[0-9a-f]{10}$/)
      // The kennitala must not appear in the id — it travels in the callback path
      // already, and a second copy would land in access logs and APM twice.
      expect(documentId).not.toContain('5501234567')
    })

    it('records nothing when Pósthólf reports a per-item failure on a 200', async () => {
      registerNotice.mockResolvedValue({
        success: false,
        errors: ['Unknown category'],
        wantsPaper: false,
      })
      returnCompanyAtCall(MAILBOX_CALL.equalityOverdue, overdueCompany())

      await service.run()

      // res.ok was true. Only the per-item flag says otherwise, so this is the
      // case a void-returning send could not have expressed.
      expect(emitDeadlineReminderEvent).not.toHaveBeenCalled()
    })

    it('records nothing when the upload fails, so the next run retries', async () => {
      putNotice.mockRejectedValue(new Error('S3 down'))
      returnCompanyAtCall(MAILBOX_CALL.equalityOverdue, overdueCompany())

      await expect(service.run()).rejects.toThrow('S3 down')

      expect(registerNotice).not.toHaveBeenCalled()
      expect(emitDeadlineReminderEvent).not.toHaveBeenCalled()
    })

    it('does not serve a company that has opted into paper delivery', async () => {
      wantsPaper.mockResolvedValue(true)
      returnCompanyAtCall(MAILBOX_CALL.equalityOverdue, overdueCompany())

      await service.run()

      expect(renderNotice).not.toHaveBeenCalled()
      expect(registerNotice).not.toHaveBeenCalled()
      // No event: nothing was delivered, and recording one would suppress the
      // retry if the preference is later cleared.
      expect(emitDeadlineReminderEvent).not.toHaveBeenCalled()
    })

    it('skips a company already served for that tier and due date', async () => {
      hasDeadlineReminderEvent.mockResolvedValue(true)
      returnCompanyAtCall(MAILBOX_CALL.equalityOverdue, overdueCompany())

      await service.run()

      expect(renderNotice).not.toHaveBeenCalled()
      expect(registerNotice).not.toHaveBeenCalled()
    })

    it('dry-runs with POSTHOLF_ENABLED unset: same query, same dedup, no send', async () => {
      delete process.env.POSTHOLF_ENABLED
      returnCompanyAtCall(MAILBOX_CALL.equalityOverdue, overdueCompany())

      await service.run()

      // The dedup check still ran, so the logged count is exactly what enabling
      // would have sent.
      expect(hasDeadlineReminderEvent).toHaveBeenCalledWith(
        'company-1',
        CompanyEventTypeEnum.EQUALITY_MAILBOX_NOTICE_SENT,
        CompanyReminderTierEnum.OVERDUE_NOTICE,
        OVERDUE_DUE.toISOString(),
      )
      expect(renderNotice).not.toHaveBeenCalled()
      expect(registerNotice).not.toHaveBeenCalled()
      expect(emitDeadlineReminderEvent).not.toHaveBeenCalled()
    })

    it('refuses to serve without POSTHOLF_DOCUMENT_ID_SECRET', async () => {
      delete process.env.POSTHOLF_DOCUMENT_ID_SECRET
      returnCompanyAtCall(MAILBOX_CALL.equalityOverdue, overdueCompany())

      await service.run()

      expect(renderNotice).not.toHaveBeenCalled()
      expect(registerNotice).not.toHaveBeenCalled()
      expect(emitDeadlineReminderEvent).not.toHaveBeenCalled()
    })
  })
})
