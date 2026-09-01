import { companyReportStatusCaseSql } from './report-status'

/**
 * `companyReportStatusCaseSql` emits raw SQL, so a typo in a table or column
 * name is not a compile error — it is a 500 on every company list request.
 * These assertions pin the identifiers and the two judgement calls behind the
 * legacy branch, both of which are easy to "tidy" into the wrong thing.
 */
describe('companyReportStatusCaseSql', () => {
  const sql = companyReportStatusCaseSql()

  it('treats an unexpired legacy certification as coverage, per report type', () => {
    expect(sql).toContain('lr.equality_valid_until >= CURRENT_DATE')
    expect(sql).toContain('lr.salary_valid_until >= CURRENT_DATE')
    expect(sql).toContain('FROM "legacy_report" lr')
    expect(sql).toContain('lr.company_id = "CompanyModel"."id"')
  })

  it('compares legacy dates against CURRENT_DATE, not NOW()', () => {
    // The legacy columns are DATEONLY: a certificate stated valid until today
    // is valid through today, and `> NOW()` would expire it at midnight.
    expect(sql).not.toMatch(/lr\.\w+_valid_until\s*>\s*NOW\(\)/)
  })

  it('never reads the legacy status columns', () => {
    // `validity` and `legacy_status` describe the *salary* certification only.
    // 120 register rows hold a live equality plan beside a lapsed one, so
    // filtering on either would mark them as missing a plan they hold.
    expect(sql).not.toContain('lr.validity')
    expect(sql).not.toContain('lr.legacy_status')
  })

  it('still requires an APPROVED, in-force report as the other way to be covered', () => {
    expect(sql).toContain("r.status = 'APPROVED'")
    expect(sql).toContain('r.valid_until > NOW()')
  })

  it('keeps the branches in priority order', () => {
    expect(sql.indexOf('MISSING_EQUALITY_REPORT')).toBeLessThan(
      sql.indexOf('MISSING_SALARY_REPORT'),
    )
    expect(sql.indexOf('MISSING_SALARY_REPORT')).toBeLessThan(
      sql.indexOf('MISSING_ACTION_PLAN'),
    )
  })
})
