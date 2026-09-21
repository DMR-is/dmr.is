import { Op } from 'sequelize'

import type { GetCompaniesQueryDto } from '../dto/get-companies-query.dto'
import {
  buildCompanyReportCriteriaWhere,
  hasReportCriteria,
} from './report-criteria'

const sqlOf = (query: Partial<GetCompaniesQueryDto>): string => {
  const where = buildCompanyReportCriteriaWhere(query as GetCompaniesQueryDto)
  if (!where) throw new Error('expected a clause')

  const clauses = (where as Record<symbol, { val: string }[]>)[Op.and]
  expect(clauses).toHaveLength(1)
  return clauses[0].val
}

describe('buildCompanyReportCriteriaWhere', () => {
  it('is inert when no report criterion is given', () => {
    expect(
      buildCompanyReportCriteriaWhere({} as GetCompaniesQueryDto),
    ).toBeUndefined()
    expect(hasReportCriteria({} as GetCompaniesQueryDto)).toBe(false)
  })

  it('treats empty lists as no criterion', () => {
    expect(
      buildCompanyReportCriteriaWhere({
        reportType: [],
        reportCompanyAdminGender: [],
      } as unknown as GetCompaniesQueryDto),
    ).toBeUndefined()
  })

  it('narrows the company without changing what a row is', () => {
    // An EXISTS, never a join: a company with four matching filings is still
    // one row, and the register's unit stays the company.
    const sql = sqlOf({ reportType: ['SALARY'] } as never)

    expect(sql).toContain('EXISTS')
    expect(sql).toContain('"cr"."company_id" = "CompanyModel"."id"')
  })

  it('only ever considers approved filings', () => {
    // A draft was never sent, a denied one was rejected and a withdrawn one
    // was taken back. Counting any of them would let a company claim a gap
    // figure off a submission the Directorate turned down.
    expect(sqlOf({ reportType: ['SALARY'] } as never)).toContain(
      `"r"."status" = 'APPROVED'`,
    )
  })

  it('applies every criterion to the SAME filing', () => {
    // One EXISTS, not one per criterion — otherwise three filings that are
    // each one thing would satisfy a query meaning one filing that is all
    // three.
    const sql = sqlOf({
      reportType: ['SALARY'],
      reportCompanyAdminGender: ['FEMALE'],
    } as never)

    expect(sql.match(/FROM "company_report"/g)).toHaveLength(1)
    expect(sql).toContain(`"r"."type" IN ('SALARY')`)
    expect(sql).toContain(`"r"."company_admin_gender" IN ('FEMALE')`)
  })

  it('reads a pay gap out of the result snapshot, excluding nulls', () => {
    // An equality plan has no result row and an incomputable gap stores JSON
    // null; neither is a gap of zero, so neither may satisfy a 0 lower bound.
    const sql = sqlOf({ reportOskyrtPercentFrom: 0 } as never)

    expect(sql).toContain("->>'oskyrtPercent'")
    expect(sql).toContain('IS NOT NULL')
    expect(sql).toContain('"rr"."report_id" = "r"."id"')
  })

  it('keeps the two gap figures apart', () => {
    const sql = sqlOf({
      reportRawGapPercentFrom: 10,
      reportOskyrtPercentTo: 4,
    } as never)

    expect(sql).toContain("->>'rawGapPercent'")
    expect(sql).toContain('>= 10')
    expect(sql).toContain("->>'oskyrtPercent'")
    expect(sql).toContain('<= 4')
  })

  it('bounds dates on the filing, as days', () => {
    const sql = sqlOf({
      reportApprovedFrom: new Date('2026-01-01T00:00:00Z'),
    } as never)

    expect(sql).toContain(`"r"."approved_at" >= '2026-01-01'`)
  })

  it('negates the improvement-plan criterion when asked for its absence', () => {
    expect(sqlOf({ reportHasImprovementPlan: true } as never)).toContain(
      'EXISTS (SELECT 1 FROM "report_employee"',
    )
    expect(sqlOf({ reportHasImprovementPlan: false } as never)).toContain(
      'NOT EXISTS (SELECT 1 FROM "report_employee"',
    )
  })

  it('refuses a non-finite gap bound rather than emitting it', () => {
    expect(
      buildCompanyReportCriteriaWhere({
        reportRawGapPercentFrom: Number.NaN,
      } as never),
    ).toBeUndefined()
  })
})
