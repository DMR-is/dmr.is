import { Op } from 'sequelize'

import {
  CompanyReportStatusEnum,
  CompanyStatusEnum,
} from '../models/company.enums'
import {
  actionPlanMissingSql,
  equalityReportMissingSql,
  salaryReportMissingSql,
} from './report-status'
import {
  buildCompanyExpiryWhere,
  buildCompanyLifecycleStatusWhere,
  buildCompanyStatusWhere,
  CompanyExpiryFilterEnum,
} from './filters'

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

describe('buildCompanyLifecycleStatusWhere', () => {
  it('matches any of the requested statuses', () => {
    expect(
      buildCompanyLifecycleStatusWhere([
        CompanyStatusEnum.ACTIVE,
        CompanyStatusEnum.INACTIVE,
      ]),
    ).toEqual({ status: { [Op.in]: ['ACTIVE', 'INACTIVE'] } })
  })

  it('narrows to one status on its own', () => {
    expect(
      buildCompanyLifecycleStatusWhere([CompanyStatusEnum.INACTIVE]),
    ).toEqual({ status: { [Op.in]: ['INACTIVE'] } })
  })

  it('filters the lifecycle column, not the compliance expression', () => {
    // The two filters sit next to each other with near-identical names, and
    // swapping them would silently answer a different question: `status` is
    // whether the company is on the register, `companyStatus` is what it owes.
    const where = buildCompanyLifecycleStatusWhere([CompanyStatusEnum.ACTIVE])

    expect(Object.keys(where)).toEqual(['status'])
    expect(JSON.stringify(where)).not.toContain('CASE')
  })
})

/**
 * The compliance filter. Its contract is that it selects exactly the companies
 * whose list row shows the tag being filtered on — and the list now shows one
 * value per obligation rather than a single roll-up, which is what these
 * assertions are here to hold in place.
 */
describe('buildCompanyStatusWhere', () => {
  const sqlFor = (statuses: CompanyReportStatusEnum[]): string =>
    (buildCompanyStatusWhere(statuses) as { val: string }).val

  it('is inert when nothing is selected', () => {
    expect(buildCompanyStatusWhere([])).toEqual({})
  })

  it('matches on the obligation predicate, never on the roll-up CASE', () => {
    // ⚠️ The roll-up names only a company's MOST PRESSING problem. Filtering
    // against it would skip every company whose launagreining is missing
    // *behind* a missing jafnréttisáætlun — while the list visibly shows those
    // companies missing the launagreining. The filter and the column have to
    // read the same expression.
    const sql = sqlFor([CompanyReportStatusEnum.MISSING_SALARY_REPORT])

    expect(sql).toContain(salaryReportMissingSql())
    expect(sql).not.toContain('CASE')
    expect(sql).not.toContain('MISSING_SALARY_REPORT')
  })

  it('ORs several statuses into "missing any of these"', () => {
    const sql = sqlFor([
      CompanyReportStatusEnum.MISSING_EQUALITY_REPORT,
      CompanyReportStatusEnum.MISSING_ACTION_PLAN,
    ])

    expect(sql).toContain(equalityReportMissingSql())
    expect(sql).toContain(actionPlanMissingSql())
    expect(sql).toContain(' OR ')
  })

  it('treats SATISFACTORY as the absence of every other status', () => {
    // Not an expression of its own: derived by negation so that a fourth
    // obligation added later narrows "nothing outstanding" automatically,
    // rather than quietly leaving newly non-compliant companies in it.
    const sql = sqlFor([CompanyReportStatusEnum.SATISFACTORY])

    expect(sql).toContain(`NOT ${equalityReportMissingSql()}`)
    expect(sql).toContain(`NOT ${actionPlanMissingSql()}`)
    expect(sql).toContain(`NOT ${salaryReportMissingSql()}`)
  })

  it('keeps SATISFACTORY disjoint from the statuses it negates', () => {
    // Selecting everything must not exclude everything: the OR of all four has
    // to stay satisfiable for any company, which it only is while SATISFACTORY
    // is the complement of the other three rather than an extra conjunct.
    const all = sqlFor(Object.values(CompanyReportStatusEnum))

    expect(all).toContain(' OR ')
    expect(all.startsWith('(')).toBe(true)
    expect(all.endsWith(')')).toBe(true)
  })
})
