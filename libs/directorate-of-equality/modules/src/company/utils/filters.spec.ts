import { Op } from 'sequelize'

import { buildCompanyExpiryWhere, CompanyExpiryFilterEnum } from './filters'

/**
 * `buildCompanyExpiryWhere` emits raw SQL, so a wrong identifier is not a
 * compile error but a 500 on the company list. These assertions pin the shape
 * of the legacy half in particular: it reads a table that was seeded for every
 * company in the register, so each of its three gates is load-bearing and each
 * is easy to drop while "simplifying" the query.
 */
describe('buildCompanyExpiryWhere', () => {
  const sqlFor = (values: CompanyExpiryFilterEnum[]): string => {
    const where = buildCompanyExpiryWhere(values)
    const clauses = (where as Record<symbol, { val: string }[]>)[Op.and]
    return clauses[0].val
  }

  const sql = sqlFor([CompanyExpiryFilterEnum.DAYS_30])

  it('is inert when nothing is selected', () => {
    expect(buildCompanyExpiryWhere([])).toEqual({})
  })

  it('keeps the report half, so a filed report still drives the queue', () => {
    expect(sql).toContain("r.status = 'APPROVED'")
    expect(sql).toContain("r.valid_until <= NOW() + INTERVAL '30 days'")
  })

  it('also reads legacy certifications, which most companies have instead', () => {
    // 1 507 of 1 753 companies at 25+ hold no report row at all, so a
    // report-only filter would hide them until the day their certificate lapsed.
    expect(sql).toContain('FROM "legacy_report" lr')
    expect(sql).toContain(
      "lr.equality_valid_until\n          BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'",
    )
    expect(sql).toContain(
      "lr.salary_valid_until\n          BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'",
    )
  })

  it('gates each legacy branch on the obligation it belongs to', () => {
    // The sheet carries a Gildistími for companies of every size, so
    // legacy_report holds live dates for companies below 25 that owe nothing.
    // Without this the filter would queue a company the status column calls
    // SATISFACTORY.
    expect(sql).toContain('"CompanyModel"."employee_count_category" IN')
    expect(sql).toContain('"CompanyModel"."salary_report_required" = true')
  })

  it('lets an in-force report supersede the frozen legacy date', () => {
    // Coverage is the union of the two sources, so it ends at the later of
    // them. A company that has filed is covered by its report; its legacy date
    // is history and must not pull it into the queue.
    expect(sql).toMatch(/AND NOT EXISTS \(\s*SELECT 1 FROM "company_report"/)
  })

  it('does not date a surrendered certificate', () => {
    expect(sql).toContain(
      "lower(btrim(lr.validity)) IS DISTINCT FROM lower('Útrunnið')",
    )
  })

  it('widens the window with the filter, taking the largest selected', () => {
    expect(sqlFor([CompanyExpiryFilterEnum.MONTHS_3])).toContain(
      "INTERVAL '3 months'",
    )
    expect(sqlFor([CompanyExpiryFilterEnum.SOON])).toContain(
      "INTERVAL '6 months'",
    )
    expect(
      sqlFor([CompanyExpiryFilterEnum.DAYS_30, CompanyExpiryFilterEnum.SOON]),
    ).toContain("INTERVAL '6 months'")
  })
})
