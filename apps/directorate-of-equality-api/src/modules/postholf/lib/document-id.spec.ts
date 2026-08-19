import { CompanyReminderTierEnum } from '../../company/models/company-event.model'
import { ReportTypeEnum } from '../../report/models/report.enums'
import {
  buildNoticeDocumentId,
  documentIdMatchesCompany,
  noticeObjectKey,
  parseNoticeDocumentId,
  POSTHOLF_DOCUMENT_ID_MAX_LENGTH,
  toDueDateYmd,
  UnsupportedNoticeTierError,
} from './document-id'

// Not real kennitalas — `disallow-kennitalas` forbids valid ones in source.
const NATIONAL_ID = '5501234567'
const OTHER_NATIONAL_ID = '5509876543'
const SECRET = 'test-secret'

const DUE = new Date('2026-05-01T00:00:00.000Z')

const build = (
  overrides: Partial<Parameters<typeof buildNoticeDocumentId>[0]> = {},
) =>
  buildNoticeDocumentId({
    nationalId: NATIONAL_ID,
    reportType: ReportTypeEnum.EQUALITY,
    tier: CompanyReminderTierEnum.OVERDUE_NOTICE,
    dueDate: DUE,
    secret: SECRET,
    ...overrides,
  })

describe('notice documentId', () => {
  describe('buildNoticeDocumentId', () => {
    it('fits inside Pósthólf’s 50-character limit and needs no URL encoding', () => {
      const id = build()

      expect(id.length).toBeLessThanOrEqual(POSTHOLF_DOCUMENT_ID_MAX_LENGTH)
      expect(id).toMatch(/^[A-Za-z0-9-]+$/)
      expect(encodeURIComponent(id)).toBe(id)
    })

    it('is stable, so a retry reuses the same id and the same object key', () => {
      expect(build()).toBe(build())
    })

    it('never contains the kennitala', () => {
      expect(build()).not.toContain(NATIONAL_ID)
    })

    it('differs per company, so two companies cannot collide on one due date', () => {
      expect(build()).not.toBe(build({ nationalId: OTHER_NATIONAL_ID }))
    })

    it('differs per report kind, which can share a due date', () => {
      expect(build()).not.toBe(build({ reportType: ReportTypeEnum.SALARY }))
    })

    it('differs per tier', () => {
      expect(build()).not.toBe(
        build({ tier: CompanyReminderTierEnum.FINES_PRECURSOR }),
      )
    })

    it('mints a new id when the due date advances, re-arming the notice', () => {
      expect(build()).not.toBe(
        build({ dueDate: new Date('2027-05-01T00:00:00.000Z') }),
      )
    })

    it('refuses to mint an id for an email-only tier', () => {
      expect(() => build({ tier: CompanyReminderTierEnum.DUE })).toThrow(
        UnsupportedNoticeTierError,
      )
    })
  })

  describe('toDueDateYmd', () => {
    it('uses UTC, matching the ISO string stored in company_event.reason', () => {
      // A late-evening UTC timestamp renders as the *next* day in local time east
      // of UTC. Using the local getters here would produce a ymd that can never
      // match `reason`, so the callback could never resolve the document.
      const late = new Date('2026-05-01T23:30:00.000Z')

      expect(toDueDateYmd(late)).toBe('2026-05-01')
      expect(late.toISOString().startsWith(toDueDateYmd(late))).toBe(true)
    })
  })

  describe('parseNoticeDocumentId', () => {
    it('round-trips the parts encoded into the id', () => {
      const parts = parseNoticeDocumentId(build())

      expect(parts).toEqual({
        reportType: ReportTypeEnum.EQUALITY,
        tier: CompanyReminderTierEnum.OVERDUE_NOTICE,
        dueDateYmd: '2026-05-01',
      })
    })

    it('round-trips the salary / precursor combination too', () => {
      const parts = parseNoticeDocumentId(
        build({
          reportType: ReportTypeEnum.SALARY,
          tier: CompanyReminderTierEnum.FINES_PRECURSOR,
        }),
      )

      expect(parts?.reportType).toBe(ReportTypeEnum.SALARY)
      expect(parts?.tier).toBe(CompanyReminderTierEnum.FINES_PRECURSOR)
    })

    it.each([
      ['empty', ''],
      ['another provider’s id', 'SOMETHING-ELSE'],
      ['unknown kind code', 'DOE-XXOV-20260501-3f9a1c7b2d'],
      ['unknown tier code', 'DOE-EQZZ-20260501-3f9a1c7b2d'],
      ['short fingerprint', 'DOE-EQOV-20260501-3f9a1c7b'],
      ['non-hex fingerprint', 'DOE-EQOV-20260501-zzzzzzzzzz'],
      ['trailing junk', 'DOE-EQOV-20260501-3f9a1c7b2d/../etc'],
      ['leading junk', 'x-DOE-EQOV-20260501-3f9a1c7b2d'],
      ['calendar-invalid date', 'DOE-EQOV-20260231-3f9a1c7b2d'],
      ['month 13', 'DOE-EQOV-20261301-3f9a1c7b2d'],
    ])('rejects %s', (_label, id) => {
      expect(parseNoticeDocumentId(id)).toBeNull()
    })
  })

  describe('documentIdMatchesCompany', () => {
    it('accepts the company the id was minted for', () => {
      expect(documentIdMatchesCompany(build(), NATIONAL_ID, SECRET)).toBe(true)
    })

    it('rejects a different company — the checklist’s core requirement', () => {
      expect(documentIdMatchesCompany(build(), OTHER_NATIONAL_ID, SECRET)).toBe(
        false,
      )
    })

    it('rejects when the secret differs, so ids cannot be forged', () => {
      expect(documentIdMatchesCompany(build(), NATIONAL_ID, 'other')).toBe(
        false,
      )
    })

    it('rejects a malformed id without throwing', () => {
      expect(documentIdMatchesCompany('nonsense', NATIONAL_ID, SECRET)).toBe(
        false,
      )
    })
  })

  describe('noticeObjectKey', () => {
    it('namespaces by kennitala so two companies can never share a key', () => {
      const id = build()

      expect(noticeObjectKey(NATIONAL_ID, id)).toBe(
        `notices/${NATIONAL_ID}/${id}.pdf`,
      )
      expect(noticeObjectKey(NATIONAL_ID, id)).not.toBe(
        noticeObjectKey(OTHER_NATIONAL_ID, id),
      )
    })
  })
})
