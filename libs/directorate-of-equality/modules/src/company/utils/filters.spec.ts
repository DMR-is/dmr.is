import { Op } from 'sequelize'

import {
  CompanyReportStatusEnum,
  CompanySectorEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../models/company.enums'
import {
  buildCompanyExpiryWhere,
  buildCompanyLifecycleStatusWhere,
  buildCompanyListQuery,
  buildCompanyStatusWhere,
  CompanyExpiryFilterEnum,
} from './filters'
import {
  actionPlanMissingSql,
  equalityReportMissingSql,
  salaryReportMissingSql,
} from './report-status'

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

/**
 * The composed builder behind both the company list and the recipient
 * resolution for a bulk email.
 *
 * These tests pin that every filter the list DTO carries reaches the query, so a
 * new filter cannot be added to the list and quietly skipped here — which would
 * put the count an admin approves and the set actually mailed out of step.
 */
describe('buildCompanyListQuery', () => {
  type ListQuery = Parameters<typeof buildCompanyListQuery>[0]

  // `page`/`pageSize` are required on the DTO but defaulted at runtime, and no
  // case here is about paging. Supplying them once keeps each test to the
  // filter it is actually exercising.
  const build = (overrides: Partial<ListQuery> = {}) =>
    buildCompanyListQuery({ page: 1, pageSize: 10, ...overrides })

  const conditionsOf = (overrides: Partial<ListQuery> = {}) => {
    const { where } = build(overrides)
    const and = (where as Record<symbol, unknown[]>)[Op.and]
    return and ?? [where]
  }

  // Both hides lifted, so a test can assert on one filter without the two
  // default conditions padding every result.
  const unhidden = { includeNotObliged: true, includeInactive: true }

  /**
   * The hides belong to the builder rather than to the list's call site: the
   * recipient resolution runs the same function, and a send that skipped them
   * would mail deregistered and not-obliged companies that never appeared in
   * the list the admin approved.
   */
  describe('the default-on register hides', () => {
    it('hides not-obliged and deregistered companies by default', () => {
      const conditions = conditionsOf()

      expect(conditions).toHaveLength(2)
      expect((conditions[0] as { val: string }).val).toMatch(/^NOT /)
      expect(conditions[1]).toEqual({ status: CompanyStatusEnum.ACTIVE })
    })

    it('lifts the obligation hide when the admin asks for it explicitly', () => {
      expect(conditionsOf({ includeNotObliged: true })).toEqual([
        { status: CompanyStatusEnum.ACTIVE },
      ])
    })

    it('lifts the obligation hide when filtering on the same axis', () => {
      // Filtering by size means the admin has already answered the question the
      // default was guessing at.
      expect(
        conditionsOf({ employeeCountCategory: CompanySizeEnum.LARGE }),
      ).toEqual([
        { employeeCountCategory: CompanySizeEnum.LARGE },
        { status: CompanyStatusEnum.ACTIVE },
      ])
    })

    it('lifts the status hide when the admin asks for it explicitly', () => {
      const conditions = conditionsOf({ includeInactive: true })

      expect(conditions).toHaveLength(1)
      expect((conditions[0] as { val: string }).val).toMatch(/^NOT /)
    })

    it('lifts the status hide when filtering to a lifecycle status', () => {
      // Filtering to Óvirkt has to return óvirk companies, not an empty page.
      const conditions = conditionsOf({ status: [CompanyStatusEnum.INACTIVE] })

      // The lifecycle filter survives and the ACTIVE hide is gone; only the
      // unrelated obligation hide is left alongside it.
      expect(conditions).toHaveLength(2)
      expect(conditions[0]).toEqual(
        buildCompanyLifecycleStatusWhere([CompanyStatusEnum.INACTIVE]),
      )
      expect((conditions[1] as { val: string }).val).toMatch(/^NOT /)
    })
  })

  it('returns the single condition unwrapped rather than in an Op.and', () => {
    const { where } = build({ ...unhidden, finesStarted: true })

    expect(where).toEqual({ finesStarted: true })
  })

  it('searches name and national id together', () => {
    const { where } = build({ ...unhidden, q: '  Fyrirtæki  ' })
    const or = (where as Record<symbol, Record<string, unknown>[]>)[Op.or]

    // Trimmed, then wrapped — an untrimmed pattern silently matches nothing.
    expect(or).toEqual([
      { name: { [Op.iLike]: '%Fyrirtæki%' } },
      { nationalId: { [Op.iLike]: '%Fyrirtæki%' } },
    ])
  })

  it('distinguishes an explicit `false` boolean from an absent one', () => {
    // `quarantined: false` is a real filter — "only companies not halted" — and
    // treating it as unset would widen the recipient set on a bulk send.
    expect(conditionsOf({ ...unhidden, quarantined: false })).toContainEqual({
      quarantined: false,
    })
    expect(build(unhidden).where).toEqual({})
  })

  it('treats `overdue: false` as no constraint', () => {
    // Asymmetric with the booleans above, and deliberately so: `overdue` is a
    // derived expression with no negative form to filter on.
    expect(build({ ...unhidden, overdue: false }).where).toEqual({})
  })

  it('combines every filter it is given', () => {
    const conditions = conditionsOf({
      ...unhidden,
      q: 'a',
      employeeCountCategory: CompanySizeEnum.LARGE,
      companyStatus: [CompanyReportStatusEnum.SATISFACTORY],
      status: [CompanyStatusEnum.ACTIVE],
      expiresWithin: [CompanyExpiryFilterEnum.MONTHS_3],
      finesStarted: true,
      quarantined: false,
      overdue: true,
      isatCategoryCode: ['01110'],
      sector: [CompanySectorEnum.PRIVATE],
    })

    expect(conditions).toHaveLength(10)
  })

  it('always joins ÍSAT, so the resolved code reaches the DTO', () => {
    // Unconditional and not `required`, otherwise every unclassified company
    // would drop out of the plain list.
    const { includes } = build({})

    expect(includes).toEqual([
      expect.objectContaining({ as: 'isatCategory', required: false }),
    ])
  })

  it('adds an include for each join-backed filter', () => {
    const { includes } = build({
      postcode: ['101'],
      isatSection: ['O'],
    })

    // Location and ÍSAT section are resolved through joins rather than columns;
    // dropping either would silently return companies the filter excluded.
    expect(includes).toHaveLength(2)
    expect(includes[1]).toMatchObject({ as: 'isatCategory', required: true })
  })

  it('ignores paging, which belongs to the caller', () => {
    // The recipient resolution passes the list's own query object through, paging
    // params included. If they reached the query, a bulk send would mail page one
    // and report it as everyone matching the filter.
    const { where } = build({
      ...unhidden,
      page: 3,
      pageSize: 10,
    })

    expect(where).toEqual({})
  })
})
