import { companyReportStatusCaseSql } from './report-status'

/**
 * `companyReportStatusCaseSql` emits raw SQL, so a typo in a table or column
 * name is not a compile error — it is a 500 on every company list request.
 * These assertions pin the identifiers and the two judgement calls behind the
 * legacy branch, both of which are easy to "tidy" into the wrong thing.
 */
describe('companyReportStatusCaseSql', () => {
  const sql = companyReportStatusCaseSql()

  // The CASE is emitted in priority order, so each report type's coverage test
  // is the text leading up to the status it yields. Sliced rather than matched
  // whole because the two branches deliberately no longer read the same
  // columns, and an assertion over the join would not notice which side gained
  // or lost a guard.
  const equalityBranch = sql.slice(0, sql.indexOf('MISSING_EQUALITY_REPORT'))
  const salaryBranch = sql.slice(
    sql.indexOf('MISSING_EQUALITY_REPORT'),
    sql.indexOf('MISSING_SALARY_REPORT'),
  )

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

  it('judges the equality branch on its own date alone', () => {
    // `validity` describes the *salary* certification. 120 register rows hold a
    // live equality plan beside a lapsed one, so filtering on it here would
    // mark them as missing a plan they hold.
    expect(equalityBranch).not.toMatch(/lr\."?validity"?/)
    expect(equalityBranch).toContain('lr.equality_valid_until >= CURRENT_DATE')
  })

  it('does not count a surrendered certificate as salary coverage', () => {
    // 20 register rows are marked Útrunnið while carrying a *future* date,
    // the certificate having been given up early. The date alone would read
    // them as covered, and nothing else would catch it: the same cell seeds
    // next_salary_report_due_at, so they are not overdue either, and the
    // renewal window bars them from filing until six months before it.
    expect(salaryBranch).toContain("lr.validity IS DISTINCT FROM 'Útrunnið'")
  })

  it('never reads legacy_status', () => {
    // Staða is the old workflow's own state (ólokið / Lokið / hætt); a
    // company's standing here is computed, not copied.
    expect(sql).not.toMatch(/lr\."?legacy_status"?/)
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
