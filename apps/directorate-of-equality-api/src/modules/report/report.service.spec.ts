/* eslint-disable local-rules/disallow-kennitalas */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Op } from 'sequelize'

import type { Logger } from '@dmr.is/logging'

import { CompanySizeEnum } from '../company/models/company.enums'
import { ReportOutlierSortByEnum } from './dto/get-report-outliers.query.dto'
import {
  type GetReportsQueryDto,
  SortDirectionEnum,
} from './dto/get-reports.query.dto'
import { ReportStatusEnum, ReportTypeEnum } from './models/report.enums'
import type { ReportModel } from './models/report.model'
import { ReportService } from './report.service'

/**
 * Unit tests for the query-building logic in `ReportService.list`. We stub
 * `ReportModel.findAndCountAll` so the test captures the exact `where`,
 * `order`, and pagination options the service passes down — assertions are
 * made against those, not against a real database round-trip.
 */

type FindAndCountAllMock = jest.Mock<
  Promise<{ rows: ReportModel[]; count: number }>,
  [Record<string, unknown>]
>
type FindByPkOrThrowMock = jest.Mock

const makeReportRow = (overrides: Partial<Record<string, unknown>> = {}) => {
  const row: Record<string, unknown> = {
    id: '00000000-0000-0000-0000-000000000001',
    identifier: 'ABC-001',
    type: ReportTypeEnum.SALARY,
    status: ReportStatusEnum.SUBMITTED,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    correctionDeadline: null,
    validUntil: null,
    equalityReportId: null,
    companyAdminName: null,
    companyAdminEmail: null,
    companyAdminGender: null,
    companyReport: {
      name: 'Blámi hf.',
      nationalId: '4703013920',
      isatCategory: '62.01.0',
      employeeCountCategory: CompanySizeEnum.MEDIUM,
    },
    reviewer: null,
    ...overrides,
  }
  // Instance methods the service calls — projections the real model
  // provides via BaseModel. Tests only need something that returns a
  // plain object shape-compatible with the DTO.
  row.fromModelToListItem = (
    waitingForAction = false,
    includesImprovementPlan = false,
  ) => {
    const companyReport = row.companyReport as
      | {
          name?: string
          nationalId?: string
          isatCategory?: string
          employeeCountCategory?: CompanySizeEnum
        }
      | null
    return {
      id: row.id,
      identifier: row.identifier,
      type: row.type,
      status: row.status,
      companyName: companyReport?.name ?? null,
      companyNationalId: companyReport?.nationalId ?? null,
      companyIsatCategory: companyReport?.isatCategory ?? null,
      companyEmployeeCountCategory:
        companyReport?.employeeCountCategory ?? null,
      companyAdminName: row.companyAdminName,
      companyAdminEmail: row.companyAdminEmail,
      companyAdminGender: row.companyAdminGender,
      reviewer: row.reviewer,
      waitingForAction,
      includesImprovementPlan,
      createdAt: row.createdAt,
      correctionDeadline: row.correctionDeadline,
      validUntil: row.validUntil,
    }
  }
  return row
}

const makeService = () => {
  const findAndCountAll: FindAndCountAllMock = jest.fn()
  const findByPkOrThrow: FindByPkOrThrowMock = jest.fn()
  const findByPk = jest.fn()
  const findOne = jest.fn()
  const logger = {
    debug: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger

  // Build the model mock first, then make `.scope()` / `.withScope()`
  // return the same object so chained calls (`model.scope('x').findAndCountAll`)
  // resolve to the same mock functions we assert against.
  const count = jest.fn().mockResolvedValue(0)
  const reportModel = {
    findAndCountAll,
    findByPkOrThrow,
    findByPk,
    findOne,
    count,
  } as unknown as typeof ReportModel & {
    scope: jest.Mock
    withScope: jest.Mock
  }
  Object.assign(reportModel, {
    scope: jest.fn(() => reportModel),
    withScope: jest.fn(() => reportModel),
  })

  // Teammate-owned models — stubbed to empty result sets so equality-report
  // paths don't touch them and salary paths return predictable zero-value
  // outputs unless a test overrides.
  const roleResultFindAll = jest.fn().mockResolvedValue([])
  const outlierFindAll = jest.fn().mockResolvedValue([])
  const outlierFindAndCountAll = jest
    .fn()
    .mockResolvedValue({ rows: [], count: 0 })
  const outlierCount = jest.fn().mockResolvedValue(0)
  const companyReportFindAll = jest.fn().mockResolvedValue([])
  const reportEventModel = {
    findAll: jest.fn().mockResolvedValue([]),
  } as unknown as typeof import('./models/report-event.model').ReportEventModel
  const reportRoleResultModel = {
    findAll: roleResultFindAll,
  } as unknown as typeof import('../report-result/models/report-role-result.model').ReportRoleResultModel
  const reportEmployeeOutlierModel = {
    findAll: outlierFindAll,
    findAndCountAll: outlierFindAndCountAll,
    count: outlierCount,
  } as unknown as typeof import('../report-employee/models/report-employee-outlier.model').ReportEmployeeOutlierModel
  const companyReportModel = {
    findAll: companyReportFindAll,
  } as unknown as typeof import('../company/models/company-report.model').CompanyReportModel
  const reportCommentModel = {
    findAll: jest.fn().mockResolvedValue([]),
  } as unknown as typeof import('../report-comment/models/report-comment.model').ReportCommentModel

  const service = new ReportService(
    logger,
    reportModel,
    reportEventModel,
    reportRoleResultModel,
    reportEmployeeOutlierModel,
    companyReportModel,
    reportCommentModel,
  )
  return {
    service,
    findAndCountAll,
    findByPkOrThrow,
    findOne,
    roleResultFindAll,
    outlierFindAll,
    outlierFindAndCountAll,
    outlierCount,
    companyReportFindAll,
    logger,
  }
}

const baseQuery = (
  overrides: Partial<GetReportsQueryDto> = {},
): GetReportsQueryDto => ({
  page: 1,
  pageSize: 10,
  ...overrides,
})

describe('ReportService.list — filter & query building', () => {
  it('defaults to newest-first sort and limit/offset derived from page/pageSize', async () => {
    const { service, findAndCountAll } = makeService()
    findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 })

    await service.list(baseQuery({ page: 3, pageSize: 25 }))

    expect(findAndCountAll).toHaveBeenCalledTimes(1)
    const opts = findAndCountAll.mock.calls[0][0]
    expect(opts.order).toEqual([['createdAt', 'DESC']])
    expect(opts.limit).toBe(25)
    expect(opts.offset).toBe(50)
  })

  it('translates type + status arrays into Op.in clauses', async () => {
    const { service, findAndCountAll } = makeService()
    findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 })

    await service.list(
      baseQuery({
        type: [ReportTypeEnum.SALARY],
        status: [ReportStatusEnum.SUBMITTED, ReportStatusEnum.IN_REVIEW],
      }),
    )

    const where = findAndCountAll.mock.calls[0][0].where as Record<
      string,
      unknown
    >
    expect(where.type).toEqual({ [Op.in]: [ReportTypeEnum.SALARY] })
    expect(where.status).toEqual({
      [Op.in]: [ReportStatusEnum.SUBMITTED, ReportStatusEnum.IN_REVIEW],
    })
  })

  it('default-excludes WITHDRAWN reports when no status filter is supplied', async () => {
    const { service, findAndCountAll } = makeService()
    findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 })

    await service.list(baseQuery({}))

    const where = findAndCountAll.mock.calls[0][0].where as Record<
      string,
      unknown
    >
    expect(where.status).toEqual({ [Op.ne]: ReportStatusEnum.WITHDRAWN })
  })

  it('allows callers to explicitly request WITHDRAWN via the status filter', async () => {
    const { service, findAndCountAll } = makeService()
    findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 })

    await service.list(baseQuery({ status: [ReportStatusEnum.WITHDRAWN] }))

    const where = findAndCountAll.mock.calls[0][0].where as Record<
      string,
      unknown
    >
    expect(where.status).toEqual({ [Op.in]: [ReportStatusEnum.WITHDRAWN] })
  })

  it('prefers unassignedReviewer over reviewerUserId when both are given', async () => {
    const { service, findAndCountAll } = makeService()
    findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 })

    await service.list(
      baseQuery({
        unassignedReviewer: true,
        reviewerUserId: ['00000000-0000-0000-0000-000000000001'],
      }),
    )

    const where = findAndCountAll.mock.calls[0][0].where as Record<
      string,
      unknown
    >
    expect(where.reviewerUserId).toEqual({ [Op.is]: null })
  })

  it('uses reviewerUserId Op.in when unassignedReviewer is false/undefined', async () => {
    const { service, findAndCountAll } = makeService()
    findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 })

    await service.list(baseQuery({ reviewerUserId: ['u1', 'u2'] }))

    const where = findAndCountAll.mock.calls[0][0].where as Record<
      string,
      unknown
    >
    expect(where.reviewerUserId).toEqual({ [Op.in]: ['u1', 'u2'] })
  })

  describe('date ranges', () => {
    const from = new Date('2026-01-01')
    const to = new Date('2026-12-31')

    it('createdFrom + createdTo → Op.between', async () => {
      const { service, findAndCountAll } = makeService()
      findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 })

      await service.list(baseQuery({ createdFrom: from, createdTo: to }))
      const where = findAndCountAll.mock.calls[0][0].where as Record<
        string,
        unknown
      >
      expect(where.createdAt).toEqual({ [Op.between]: [from, to] })
    })

    it('only createdFrom → Op.gte', async () => {
      const { service, findAndCountAll } = makeService()
      findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 })

      await service.list(baseQuery({ createdFrom: from }))
      const where = findAndCountAll.mock.calls[0][0].where as Record<
        string,
        unknown
      >
      expect(where.createdAt).toEqual({ [Op.gte]: from })
    })

    it('only correctionDeadlineTo → Op.lte', async () => {
      const { service, findAndCountAll } = makeService()
      findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 })

      await service.list(baseQuery({ correctionDeadlineTo: to }))
      const where = findAndCountAll.mock.calls[0][0].where as Record<
        string,
        unknown
      >
      expect(where.correctionDeadline).toEqual({ [Op.lte]: to })
    })
  })

  describe('free-text search', () => {
    it('adds an Op.or across identifier, company name, kennitala (no person fields)', async () => {
      const { service, findAndCountAll } = makeService()
      findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 })

      await service.list(baseQuery({ q: 'Blámi' }))
      const where = findAndCountAll.mock.calls[0][0].where as Record<
        symbol,
        unknown
      >

      const orBranches = where[Op.or] as Array<Record<string, unknown>>
      expect(orBranches).toHaveLength(3)
      const keys = orBranches.map((b) => Object.keys(b)[0])
      expect(keys).toEqual(
        expect.arrayContaining([
          'identifier',
          '$companyReport.name$',
          '$companyReport.national_id$',
        ]),
      )
      expect(keys).not.toContain('contactName')
      expect(keys).not.toContain('contactEmail')
    })

    it('pattern wraps the term in % on both sides', async () => {
      const { service, findAndCountAll } = makeService()
      findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 })

      await service.list(baseQuery({ q: 'Blámi' }))
      const where = findAndCountAll.mock.calls[0][0].where as Record<
        symbol,
        unknown
      >
      const firstBranch = (where[Op.or] as Array<Record<string, unknown>>)[0]
      const clause = Object.values(firstBranch)[0] as Record<symbol, string>
      expect(clause[Op.iLike]).toBe('%Blámi%')
    })
  })

  describe('sort', () => {
    it('applies asc direction when requested', async () => {
      const { service, findAndCountAll } = makeService()
      findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 })

      await service.list(
        baseQuery({
          sortBy: 'identifier' as GetReportsQueryDto['sortBy'],
          direction: 'asc' as GetReportsQueryDto['direction'],
        }),
      )
      const opts = findAndCountAll.mock.calls[0][0]
      expect(opts.order).toEqual([['identifier', 'ASC']])
    })
  })

  describe('response shape', () => {
    it('hydrates rows into compact list items + paging metadata', async () => {
      const { service, findAndCountAll } = makeService()
      findAndCountAll.mockResolvedValueOnce({
        rows: [
          makeReportRow(),
          makeReportRow({
            id: '00000000-0000-0000-0000-000000000002',
            identifier: 'ABC-002',
          }),
        ] as unknown as ReportModel[],
        count: 2,
      })

      const result = await service.list(baseQuery({ page: 1, pageSize: 10 }))

      expect(result.reports).toHaveLength(2)
      expect(result.reports[0]).toEqual(
        expect.objectContaining({
          id: '00000000-0000-0000-0000-000000000001',
          identifier: 'ABC-001',
          type: ReportTypeEnum.SALARY,
          status: ReportStatusEnum.SUBMITTED,
          companyName: 'Blámi hf.',
          companyNationalId: '4703013920',
        }),
      )
      expect(result.paging).toEqual(
        expect.objectContaining({
          page: 1,
          pageSize: 10,
          totalItems: 2,
          totalPages: 1,
          hasNextPage: false,
        }),
      )
    })
  })
})

describe('ReportService.getById', () => {
  const baseReportShape = {
    id: '00000000-0000-0000-0000-000000000001',
    identifier: 'ABC-001',
    type: ReportTypeEnum.SALARY,
    status: ReportStatusEnum.SUBMITTED,
    companyAdminName: null,
    companyAdminEmail: null,
    companyAdminGender: null,
    contactName: null,
    contactEmail: null,
    contactPhone: null,
    averageEmployeeMaleCount: null,
    averageEmployeeFemaleCount: null,
    averageEmployeeNeutralCount: null,
    providerType: null,
    providerId: null,
    importedFromExcel: false,
    equalityReportId: null,
    reviewerUserId: null,
    approvedAt: null,
    validUntil: null,
    correctionDeadline: null,
    equalityReportContent: null,
    finesStartedAt: null,
    reviewer: null,
    companyReport: {
      id: 'cr1',
      companyId: 'c1',
      reportId: '00000000-0000-0000-0000-000000000001',
      parentCompanyId: null,
      name: 'Blámi hf.',
      nationalId: '4703013920',
      address: 'Hafnarstræti 5',
      city: 'Reykjavík',
      postcode: '101',
      employeeCountCategory: CompanySizeEnum.MEDIUM,
      isatCategory: '62010',
    },
    comments: [],
  }

  // The service now calls instance methods on the model (`report.fromModel()`,
  // `linkedEquality.fromModelToEqualityReport()`); the tests run against plain
  // objects, so we attach stub implementations that return DTO-shaped payloads.
  const withFromModel = <T extends Record<string, unknown>>(
    row: T,
  ): T & {
    fromModel: () => Omit<T, 'fromModel' | 'fromModelToEqualityReport'>
  } =>
    Object.assign(row, {
      fromModel: () => {
        const { fromModel, fromModelToEqualityReport, ...plain } = row as T & {
          fromModel?: unknown
          fromModelToEqualityReport?: unknown
        }
        return plain
      },
    })

  const withEqualityProjection = <T extends Record<string, unknown>>(
    row: T,
  ): T & { fromModelToEqualityReport: () => unknown } =>
    Object.assign(row, {
      fromModelToEqualityReport: () => ({
        id: row.id,
        identifier: row.identifier ?? null,
        status: row.status,
        content: row.equalityReportContent ?? null,
        approvedAt: row.approvedAt ?? null,
        validUntil: row.validUntil ?? null,
        correctionDeadline: row.correctionDeadline ?? null,
      }),
    })

  const makeDetailedReportRow = (
    overrides: Partial<Record<string, unknown>> = {},
  ) =>
    withEqualityProjection(
      withFromModel({
        ...baseReportShape,
        ...overrides,
      }),
    )

  const makeLinkedEqualityRow = (
    overrides: Partial<Record<string, unknown>> = {},
  ) =>
    withEqualityProjection({
      id: '00000000-0000-0000-0000-000000000099',
      identifier: 'ABC-000',
      status: ReportStatusEnum.APPROVED,
      equalityReportContent: null,
      approvedAt: null,
      validUntil: null,
      correctionDeadline: null,
      ...overrides,
    })

  const baseReport = makeDetailedReportRow()

  describe('equality detail', () => {
    it('returns the report itself as equalityReport when type=EQUALITY', async () => {
      const { service, findByPkOrThrow } = makeService()
      findByPkOrThrow.mockResolvedValueOnce(
        makeDetailedReportRow({
          type: ReportTypeEnum.EQUALITY,
          equalityReportContent: 'Jafnréttisáætlun body',
        }) as unknown as ReportModel,
      )

      const detail = await service.getById(baseReport.id)

      expect(detail.equalityReport).toEqual(
        expect.objectContaining({
          id: baseReport.id,
          identifier: 'ABC-001',
          content: 'Jafnréttisáætlun body',
          status: ReportStatusEnum.SUBMITTED,
        }),
      )
    })
  })

  describe('salary detail', () => {
    it('loads the linked equality report via equalityReportId', async () => {
      const { service, findByPkOrThrow } = makeService()
      const linkedEqualityId = '00000000-0000-0000-0000-000000000099'
      findByPkOrThrow.mockResolvedValueOnce(
        makeDetailedReportRow({
          type: ReportTypeEnum.SALARY,
          equalityReportId: linkedEqualityId,
        }) as unknown as ReportModel,
      )

      // Service calls reportModel.findByPk internally to load the equality
      const serviceAny = service as unknown as {
        reportModel: { findByPk: jest.Mock }
      }
      serviceAny.reportModel.findByPk.mockResolvedValueOnce(
        makeLinkedEqualityRow({
          id: linkedEqualityId,
          equalityReportContent: 'Linked equality text',
          approvedAt: new Date('2026-02-01'),
        }),
      )

      const detail = await service.getById(baseReport.id)

      expect(detail.equalityReport).toEqual(
        expect.objectContaining({
          id: linkedEqualityId,
          identifier: 'ABC-000',
          content: 'Linked equality text',
          status: ReportStatusEnum.APPROVED,
        }),
      )
    })

    it('throws when a salary report has no equalityReportId (data integrity)', async () => {
      const { service, findByPkOrThrow, logger } = makeService()
      findByPkOrThrow.mockResolvedValueOnce(
        makeDetailedReportRow({
          type: ReportTypeEnum.SALARY,
          equalityReportId: null,
        }) as unknown as ReportModel,
      )

      await expect(service.getById(baseReport.id)).rejects.toThrow(
        /no linked equality report/,
      )
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('no linked equality report'),
        expect.objectContaining({
          category: 'resolveEqualityReport',
          reportId: baseReport.id,
          reportType: ReportTypeEnum.SALARY,
        }),
      )
    })

    it('throws when equalityReportId points to a nonexistent report', async () => {
      const { service, findByPkOrThrow, logger } = makeService()
      findByPkOrThrow.mockResolvedValueOnce(
        makeDetailedReportRow({
          type: ReportTypeEnum.SALARY,
          equalityReportId: '00000000-0000-0000-0000-000000000abc',
        }) as unknown as ReportModel,
      )

      const serviceAny = service as unknown as {
        reportModel: { findByPk: jest.Mock }
      }
      serviceAny.reportModel.findByPk.mockResolvedValueOnce(null)

      await expect(service.getById(baseReport.id)).rejects.toThrow(
        /does not exist/,
      )
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('non-existent equality report'),
        expect.objectContaining({
          category: 'resolveEqualityReport',
          reportId: baseReport.id,
          danglingEqualityReportId: '00000000-0000-0000-0000-000000000abc',
        }),
      )
    })
  })

  describe('subsidiaries', () => {
    it('returns an empty array when no subsidiary company_report rows exist', async () => {
      const { service, findByPkOrThrow, companyReportFindAll } = makeService()
      findByPkOrThrow.mockResolvedValueOnce(
        makeDetailedReportRow({
          type: ReportTypeEnum.EQUALITY,
        }) as unknown as ReportModel,
      )

      const detail = await service.getById(baseReport.id)

      expect(detail.subsidiaries).toEqual([])
      expect(companyReportFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reportId: baseReport.id,
            parentCompanyId: { [Op.not]: null },
          }),
        }),
      )
    })

    it('maps subsidiary company_report rows into the response', async () => {
      const { service, findByPkOrThrow, companyReportFindAll } = makeService()
      findByPkOrThrow.mockResolvedValueOnce(
        makeDetailedReportRow({
          type: ReportTypeEnum.EQUALITY,
        }) as unknown as ReportModel,
      )

      const subsidiaryDto = {
        id: 'cr2',
        companyId: 'c2',
        reportId: baseReport.id,
        parentCompanyId: 'c1',
        name: 'Blámi dóttir ehf.',
        nationalId: '4703013921',
        address: 'Hafnarstræti 6',
        city: 'Reykjavík',
        postcode: '101',
        employeeCountCategory: CompanySizeEnum.SMALL,
        isatCategory: '62010',
      }
      companyReportFindAll.mockResolvedValueOnce([
        { fromModel: () => subsidiaryDto },
      ])

      const detail = await service.getById(baseReport.id)

      expect(detail.subsidiaries).toEqual([subsidiaryDto])
    })
  })

  it('throws when companyReport snapshot is missing (data integrity guard)', async () => {
    const { service, findByPkOrThrow, logger } = makeService()
    findByPkOrThrow.mockResolvedValueOnce(
      makeDetailedReportRow({
        type: ReportTypeEnum.EQUALITY,
        companyReport: null,
      }) as unknown as ReportModel,
    )

    await expect(service.getById(baseReport.id)).rejects.toThrow(
      /has no companyReport snapshot/,
    )
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('has no companyReport snapshot'),
      expect.objectContaining({
        category: 'getById',
        reportId: baseReport.id,
        reportIdentifier: baseReport.identifier,
      }),
    )
  })

  describe('salary calculations', () => {
    it('returns null/empty calc blocks for equality reports without querying role results or outliers', async () => {
      const {
        service,
        findByPkOrThrow,
        roleResultFindAll,
        outlierCount,
      } = makeService()
      findByPkOrThrow.mockResolvedValueOnce(
        makeDetailedReportRow({
          type: ReportTypeEnum.EQUALITY,
          result: null,
        }) as unknown as ReportModel,
      )

      const detail = await service.getById(baseReport.id)

      expect(detail.result).toBeNull()
      expect(detail.roleResults).toEqual([])
      expect(detail.includesImprovementPlan).toBe(false)
      expect(roleResultFindAll).not.toHaveBeenCalled()
      expect(outlierCount).not.toHaveBeenCalled()
    })

    it('returns null/empty calc blocks for salary reports before scoring has run (result missing)', async () => {
      const {
        service,
        findByPkOrThrow,
        roleResultFindAll,
        outlierCount,
      } = makeService()
      findByPkOrThrow.mockResolvedValueOnce(
        makeDetailedReportRow({
          type: ReportTypeEnum.SALARY,
          equalityReportId: '00000000-0000-0000-0000-000000000099',
          result: null,
        }) as unknown as ReportModel,
      )

      const serviceAny = service as unknown as {
        reportModel: { findByPk: jest.Mock }
      }
      serviceAny.reportModel.findByPk.mockResolvedValueOnce(
        makeLinkedEqualityRow(),
      )

      const detail = await service.getById(baseReport.id)

      expect(detail.result).toBeNull()
      expect(detail.roleResults).toEqual([])
      expect(detail.includesImprovementPlan).toBe(false)
      expect(roleResultFindAll).not.toHaveBeenCalled()
      expect(outlierCount).not.toHaveBeenCalled()
    })

    it('loads role results and flags includesImprovementPlan when outliers exist on salary report', async () => {
      const {
        service,
        findByPkOrThrow,
        roleResultFindAll,
        outlierCount,
      } = makeService()

      const resultId = '00000000-0000-0000-0000-000000000111'
      const linkedEqualityId = '00000000-0000-0000-0000-000000000099'
      findByPkOrThrow.mockResolvedValueOnce(
        makeDetailedReportRow({
          type: ReportTypeEnum.SALARY,
          equalityReportId: linkedEqualityId,
          result: withFromModel({
            id: resultId,
            reportId: baseReport.id,
            averageMaleSalary: 1000,
            averageFemaleSalary: 900,
            averageNeutralSalary: 0,
            averageSalary: 950,
            minimumSalary: 500,
            maximumSalary: 2000,
            medianSalary: 950,
            salaryDifferenceMaleFemale: 10,
            salaryDifferenceMaleNeutral: 0,
            salaryDifferenceFemaleMale: -10,
            salaryDifferenceFemaleNeutral: 0,
            salaryDifferenceNeutralMale: 0,
            salaryDifferenceNeutralFemale: 0,
            salaryDifferenceThresholdPercent: 5,
          }),
        }) as unknown as ReportModel,
      )

      const serviceAny = service as unknown as {
        reportModel: { findByPk: jest.Mock }
      }
      serviceAny.reportModel.findByPk.mockResolvedValueOnce(
        makeLinkedEqualityRow({
          id: linkedEqualityId,
          equalityReportContent: 'Linked equality text',
          approvedAt: new Date('2026-02-01'),
        }),
      )

      const roleResultRow = withFromModel({
        id: 'rr1',
        reportResultId: resultId,
        reportEmployeeRoleId: 'role1',
        averageSalary: 1000,
        minimumSalary: 500,
        maximumSalary: 1500,
        medianSalary: 1000,
        averageMaleSalary: 1100,
        averageFemaleSalary: 900,
        averageNeutralSalary: 0,
        minimumMaleSalary: 600,
        minimumFemaleSalary: 500,
        minimumNeutralSalary: 0,
        maximumMaleSalary: 1500,
        maximumFemaleSalary: 1200,
        maximumNeutralSalary: 0,
      })
      roleResultFindAll.mockResolvedValueOnce([roleResultRow])
      outlierCount.mockResolvedValueOnce(3)

      const detail = await service.getById(baseReport.id)

      expect(detail.result).toEqual(
        expect.objectContaining({ id: resultId, averageSalary: 950 }),
      )
      expect(detail.roleResults).toHaveLength(1)
      expect(detail.roleResults[0]).toEqual(
        expect.objectContaining({ reportResultId: resultId }),
      )
      expect(detail.includesImprovementPlan).toBe(true)
      expect(outlierCount).toHaveBeenCalledTimes(1)

      expect(roleResultFindAll).toHaveBeenCalledWith({
        where: { reportResultId: resultId },
      })
    })
  })
})

describe('ReportService.getOutliers', () => {
  const REPORT_ID = '00000000-0000-0000-0000-000000000001'

  const makeDetailedSalaryReportRow = () => {
    const row = {
      id: REPORT_ID,
      type: ReportTypeEnum.SALARY,
      status: ReportStatusEnum.SUBMITTED,
      result: {
        outlierAnalysisSnapshot: {
          employees: [
            {
              ordinal: 1,
              adjustedBaseSalary: 950000,
              predictedBaseSalary: 1000000,
              scoreBucketRangeFrom: 500,
              scoreBucketRangeTo: 600,
              direction: 'BELOW',
              differencePercent: -5,
              allowedDifferencePercent: 1.95,
              isOutlier: true,
            },
          ],
        },
      },
    }
    return row
  }

  const makeOutlierRow = (
    overrides: Partial<Record<string, unknown>> = {},
  ) => ({
    id: 'outlier-1',
    reportEmployeeId: 'employee-1',
    groupId: 'group-1',
    group: {
      id: 'group-1',
      name: 'Tenure',
      reason: 'Tenure premium',
      action: 'Reviewed',
      signatureName: 'Reviewer',
      signatureRole: 'HR',
    },
    reportEmployee: {
      id: 'employee-1',
      ordinal: 1,
      gender: 'FEMALE',
      role: { id: 'role-1', title: 'Engineer' },
    },
    fromModel(
      analysis: {
        adjustedBaseSalary?: number
        predictedBaseSalary?: number | null
        scoreBucketRangeFrom?: number | null
        scoreBucketRangeTo?: number | null
        direction?: string | null
        differencePercent?: number | null
        allowedDifferencePercent?: number
      } | null = null,
    ) {
      const r = this as unknown as Record<string, unknown>
      const re = r.reportEmployee as Record<string, unknown> | undefined
      const role = re?.role as Record<string, unknown> | undefined
      const group = r.group as Record<string, unknown> | undefined
      return {
        id: r.id,
        reportEmployeeId: r.reportEmployeeId,
        employeeOrdinal: re?.ordinal ?? null,
        gender: re?.gender ?? null,
        roleTitle: role?.title ?? null,
        groupId: r.groupId,
        groupName: group?.name ?? null,
        reason: group?.reason ?? null,
        action: group?.action ?? null,
        signatureName: group?.signatureName ?? null,
        signatureRole: group?.signatureRole ?? null,
        adjustedBaseSalary: analysis?.adjustedBaseSalary ?? null,
        predictedBaseSalary: analysis?.predictedBaseSalary ?? null,
        scoreBucketRangeFrom: analysis?.scoreBucketRangeFrom ?? null,
        scoreBucketRangeTo: analysis?.scoreBucketRangeTo ?? null,
        direction: analysis?.direction ?? null,
        differencePercent: analysis?.differencePercent ?? null,
        allowedDifferencePercent: analysis?.allowedDifferencePercent ?? null,
      }
    },
    ...overrides,
  })

  it('paginates outliers and merges analysis snapshot fields by ordinal', async () => {
    const { service, findByPkOrThrow, outlierFindAndCountAll } = makeService()
    findByPkOrThrow.mockResolvedValueOnce(
      makeDetailedSalaryReportRow() as unknown as ReportModel,
    )
    outlierFindAndCountAll.mockResolvedValueOnce({
      rows: [makeOutlierRow()],
      count: 1,
    })

    const result = await service.getOutliers(REPORT_ID, {
      page: 1,
      pageSize: 10,
    })

    expect(result.outliers).toHaveLength(1)
    expect(result.outliers[0]).toEqual(
      expect.objectContaining({
        employeeOrdinal: 1,
        roleTitle: 'Engineer',
        gender: 'FEMALE',
        groupId: 'group-1',
        groupName: 'Tenure',
        reason: 'Tenure premium',
        adjustedBaseSalary: 950000,
        predictedBaseSalary: 1000000,
        scoreBucketRangeFrom: 500,
        scoreBucketRangeTo: 600,
        direction: 'BELOW',
        allowedDifferencePercent: 1.95,
      }),
    )
    expect(result.paging).toEqual(
      expect.objectContaining({
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
      }),
    )
  })

  it('returns empty list with null-safe analysis when the report has no result', async () => {
    const { service, findByPkOrThrow, outlierFindAndCountAll } = makeService()
    findByPkOrThrow.mockResolvedValueOnce({
      id: REPORT_ID,
      type: ReportTypeEnum.EQUALITY,
      result: null,
    } as unknown as ReportModel)
    outlierFindAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 })

    const result = await service.getOutliers(REPORT_ID, {
      page: 1,
      pageSize: 10,
    })

    expect(result.outliers).toEqual([])
    expect(result.paging.totalItems).toBe(0)
  })

  // Capture the `order` the service hands Sequelize. Each tuple is either
  // [{ as }, column, direction] (direct column on `reportEmployee`) or
  // [{ as }, { as }, column, direction] (nested `role.title`).
  const captureOrder = async (
    query: Parameters<ReportService['getOutliers']>[1],
  ) => {
    const { service, findByPkOrThrow, outlierFindAndCountAll } = makeService()
    findByPkOrThrow.mockResolvedValueOnce(
      makeDetailedSalaryReportRow() as unknown as ReportModel,
    )
    outlierFindAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 })

    await service.getOutliers(REPORT_ID, query)

    return outlierFindAndCountAll.mock.calls[0][0].order as Array<
      Array<{ as?: string } | string>
    >
  }

  it('defaults to employee ordinal ascending when no sort is given', async () => {
    const order = await captureOrder({ page: 1, pageSize: 10 })

    expect(order).toHaveLength(1)
    expect((order[0][0] as { as: string }).as).toBe('reportEmployee')
    expect(order[0][1]).toBe('ordinal')
    expect(order[0][2]).toBe('ASC')
  })

  it('sorts by a direct employee column with an ordinal tiebreaker', async () => {
    const order = await captureOrder({
      page: 1,
      pageSize: 10,
      sortBy: ReportOutlierSortByEnum.SCORE,
      direction: SortDirectionEnum.DESC,
    })

    expect((order[0][0] as { as: string }).as).toBe('reportEmployee')
    expect(order[0][1]).toBe('score')
    expect(order[0][2]).toBe('DESC')
    // Deterministic paging: ties broken by ordinal ascending.
    expect(order[1][1]).toBe('ordinal')
    expect(order[1][2]).toBe('ASC')
  })

  it('sorts by the nested role title', async () => {
    const order = await captureOrder({
      page: 1,
      pageSize: 10,
      sortBy: ReportOutlierSortByEnum.ROLE_TITLE,
      direction: SortDirectionEnum.ASC,
    })

    expect((order[0][0] as { as: string }).as).toBe('reportEmployee')
    expect((order[0][1] as { as: string }).as).toBe('role')
    expect(order[0][2]).toBe('title')
    expect(order[0][3]).toBe('ASC')
    expect(order[1][1]).toBe('ordinal')
  })

  it('defaults the direction to ascending when only sortBy is given', async () => {
    const order = await captureOrder({
      page: 1,
      pageSize: 10,
      sortBy: ReportOutlierSortByEnum.GENDER,
    })

    expect(order[0][1]).toBe('gender')
    expect(order[0][2]).toBe('ASC')
  })
})

describe('ReportService.getActiveEqualityForCompany', () => {
  const COMPANY_ID = '00000000-0000-0000-0000-0000000000c1'

  it('returns a slim summary when an APPROVED EQUALITY report still in its validity window exists for the company', async () => {
    const { service, findOne } = makeService()
    const approvedAt = new Date('2025-06-01T00:00:00.000Z')
    const validUntil = new Date('2028-06-01T00:00:00.000Z')
    findOne.mockResolvedValueOnce({
      id: 'eq-1',
      identifier: 'EQ-2025-001',
      approvedAt,
      validUntil,
    })

    const result = await service.getActiveEqualityForCompany(COMPANY_ID)

    expect(result).toEqual({
      id: 'eq-1',
      identifier: 'EQ-2025-001',
      approvedAt,
      validUntil,
    })

    // Verify the where-clause filters the way the README describes.
    const callArg = findOne.mock.calls[0][0]
    expect(callArg.where).toEqual(
      expect.objectContaining({
        type: ReportTypeEnum.EQUALITY,
        status: ReportStatusEnum.APPROVED,
      }),
    )
    expect(callArg.where.validUntil).toEqual({ [Op.gt]: expect.any(Date) })
    expect(callArg.order).toEqual([['approvedAt', 'DESC']])
    expect(callArg.include[0]).toEqual(
      expect.objectContaining({
        as: 'companyReport',
        where: { companyId: COMPANY_ID },
        required: true,
      }),
    )
  })

  it('returns null when no equality report matches the requested company', async () => {
    const { service, findOne } = makeService()
    findOne.mockResolvedValueOnce(null)

    expect(await service.getActiveEqualityForCompany(COMPANY_ID)).toBeNull()

    const callArg = findOne.mock.calls[0][0]
    expect(callArg.include[0]).toEqual(
      expect.objectContaining({
        where: { companyId: COMPANY_ID },
        required: true,
      }),
    )
  })

  it('returns null when the matching equality report is not APPROVED', async () => {
    const { service, findOne } = makeService()
    findOne.mockResolvedValueOnce(null)

    expect(await service.getActiveEqualityForCompany(COMPANY_ID)).toBeNull()

    const callArg = findOne.mock.calls[0][0]
    expect(callArg.where).toEqual(
      expect.objectContaining({
        type: ReportTypeEnum.EQUALITY,
        status: ReportStatusEnum.APPROVED,
      }),
    )
  })

  it('returns null when the matching equality report is expired', async () => {
    const { service, findOne } = makeService()
    findOne.mockResolvedValueOnce(null)

    expect(await service.getActiveEqualityForCompany(COMPANY_ID)).toBeNull()

    const callArg = findOne.mock.calls[0][0]
    expect(callArg.where.validUntil).toEqual({ [Op.gt]: expect.any(Date) })
  })
})
