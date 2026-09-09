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
 * The composed builder behind both the company list and the recipient
 * resolution for a bulk email.
 *
 * ⚠️ Those two callers asking the same question through the same code is the
 * whole point. If they drifted, the count an admin approves on the "senda
 * tölvupóst (N)" button and the set of companies actually written to would
 * disagree — silently, and in the direction of mailing companies nobody
 * selected. These tests pin that every filter the list DTO carries reaches the
 * query, so a new filter cannot be added to the list and quietly skipped here.
 */
describe('buildCompanyListQuery', () => {
  const conditionsOf = (query: Parameters<typeof buildCompanyListQuery>[0]) => {
    const { where } = buildCompanyListQuery(query)
    const and = (where as Record<symbol, unknown[]>)[Op.and]
    return and ?? [where]
  }

  it('is inert for an empty query', () => {
    expect(buildCompanyListQuery({})).toEqual({ where: {}, includes: [] })
  })

  it('returns the single condition unwrapped rather than in an Op.and', () => {
    const { where } = buildCompanyListQuery({ finesStarted: true })

    expect(where).toEqual({ finesStarted: true })
  })

  it('searches name and national id together', () => {
    const { where } = buildCompanyListQuery({ q: '  Fyrirtæki  ' })
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
    expect(conditionsOf({ quarantined: false })).toContainEqual({
      quarantined: false,
    })
    expect(buildCompanyListQuery({}).where).toEqual({})
  })

  it('treats `overdue: false` as no constraint', () => {
    // Asymmetric with the booleans above, and deliberately so: `overdue` is a
    // derived expression with no negative form to filter on.
    expect(buildCompanyListQuery({ overdue: false })).toEqual({
      where: {},
      includes: [],
    })
  })

  it('combines every filter it is given', () => {
    const conditions = conditionsOf({
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

  it('adds an include for each join-backed filter', () => {
    const { includes } = buildCompanyListQuery({
      postcode: ['101'],
      isatSection: ['O'],
    })

    // Location and ÍSAT section are resolved through joins rather than columns;
    // dropping either would silently return companies the filter excluded.
    expect(includes).toHaveLength(2)
  })

  it('ignores paging, which belongs to the caller', () => {
    // ⚠️ The recipient resolution passes the list's own query object through,
    // paging params included. If they reached the query, a bulk send would mail
    // page one and report it as everyone matching the filter.
    const { where } = buildCompanyListQuery({ page: 3, pageSize: 10 })

    expect(where).toEqual({})
  })
})
