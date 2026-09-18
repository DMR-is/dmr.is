import { Op } from 'sequelize'

import { buildReportCompanyWhere } from './filters'

/**
 * Unwrap the single `literal()` a company filter produces, as SQL text.
 *
 * The builder always returns exactly one clause under `Op.and` — the whole
 * point is that every dimension collapses into ONE correlated EXISTS — so a
 * helper that asserts that shape on the way out keeps the tests below about
 * the SQL rather than about the wrapper.
 */
const sqlOf = (filters: Parameters<typeof buildReportCompanyWhere>[0]) => {
  const where = buildReportCompanyWhere(filters)
  if (!where) throw new Error('expected a clause')

  const clauses = (where as Record<symbol, { val: string }[]>)[Op.and]
  expect(clauses).toHaveLength(1)

  return clauses[0].val
}

describe('buildReportCompanyWhere', () => {
  it('is inert when no dimension is set', () => {
    expect(buildReportCompanyWhere({})).toBeUndefined()
  })

  it('treats empty lists as no constraint, not as "match nothing"', () => {
    // A cleared filter must widen the result set back out. Building an
    // `IN ()` here would be a syntax error at best and an empty page at worst.
    expect(
      buildReportCompanyWhere({
        employeeCountCategory: [],
        sector: [],
        isatCategoryCode: [],
        isatSection: [],
        regionCode: [],
        postcode: [],
      }),
    ).toBeUndefined()
  })

  it('correlates on the report and pins to the parent snapshot', () => {
    const sql = sqlOf({ sector: ['SVEITARFELAG'] })

    expect(sql).toContain('"cr"."report_id" = "ReportModel"."id"')
    // Without this a group filing would match once per subsidiary.
    expect(sql).toContain('"cr"."parent_company_id" IS NULL')
    expect(sql).toContain('"c"."sector" IN (\'SVEITARFELAG\')')
  })

  it('reads the company, never the frozen company_report snapshot', () => {
    // `company_report.isat_category` is free text and independent of the
    // admin-owned code; filtering it would answer a different question.
    const sql = sqlOf({ isatCategoryCode: ['01110'] })

    expect(sql).toContain('"c"."isat_category_code" IN (\'01110\')')
    expect(sql).not.toContain('"cr"."isat_category"')
  })

  it('ANDs several dimensions into one EXISTS', () => {
    const sql = sqlOf({
      employeeCountCategory: ['MEDIUM', 'LARGE'],
      sector: ['RIKISADILI'],
    })

    expect(sql.match(/EXISTS/g)).toHaveLength(1)
    expect(sql).toContain(
      '"c"."employee_count_category" IN (\'MEDIUM\', \'LARGE\')',
    )
    expect(sql).toContain('"c"."sector" IN (\'RIKISADILI\')')
  })

  it('resolves ÍSAT section through the reference table', () => {
    const sql = sqlOf({ isatSection: ['A'] })

    expect(sql).toContain('"ic"."code" = "c"."isat_category_code"')
    expect(sql).toContain('"ic"."section" IN (\'A\')')
  })

  it('resolves postcode and region through the company postcode', () => {
    expect(sqlOf({ postcode: ['101'] })).toContain('"p"."code" IN (\'101\')')

    const regionSql = sqlOf({ regionCode: ['CAPITAL'] })
    expect(regionSql).toContain('"r"."id" = "p"."region_id"')
    expect(regionSql).toContain('"r"."code" IN (\'CAPITAL\')')
  })

  it('escapes quotes rather than letting a value close the literal', () => {
    // These values are enum- and string-validated before they get here, so
    // this is the second line of defence — but it is the only place in this
    // file where a value reaches the statement verbatim.
    const sql = sqlOf({ postcode: ["10'1"] })

    expect(sql).toContain("'10''1'")
  })
})
