/* eslint-disable local-rules/disallow-kennitalas */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Op } from 'sequelize'

import type { Logger } from '@dmr.is/logging'

import type { GetReportsQueryDto } from './dto/get-reports.query.dto'
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
    companyReport: {
      name: 'Blámi hf.',
      nationalId: '4703013920',
    },
    reviewer: null,
    ...overrides,
  }
  // Instance methods the service calls — projections the real model
  // provides via BaseModel. Tests only need something that returns a
  // plain object shape-compatible with the DTO.
  row.fromModelToListItem = () => ({
    id: row.id,
    identifier: row.identifier,
    type: row.type,
    status: row.status,
    companyName: (row.companyReport as { name?: string } | null)?.name ?? null,
    companyNationalId:
      (row.companyReport as { nationalId?: string } | null)?.nationalId ?? null,
    reviewer: row.reviewer,
    createdAt: row.createdAt,
    correctionDeadline: row.correctionDeadline,
    validUntil: row.validUntil,
  })
  return row
}

const makeService = () => {
  const findAndCountAll: FindAndCountAllMock = jest.fn()
  const findByPkOrThrow: FindByPkOrThrowMock = jest.fn()
  const findByPk = jest.fn()
  const logger = {
    debug: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger

  // Build the model mock first, then make `.scope()` / `.withScope()`
  // return the same object so chained calls (`model.scope('x').findAndCountAll`)
  // resolve to the same mock functions we assert against.
  const reportModel = {
    findAndCountAll,
    findByPkOrThrow,
    findByPk,
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
  const reportEventModel = {
    findAll: jest.fn().mockResolvedValue([]),
  } as unknown as typeof import('./models/report-event.model').ReportEventModel
  const reportRoleResultModel = {
    findAll: roleResultFindAll,
  } as unknown as typeof import('../report-result/models/report-role-result.model').ReportRoleResultModel
  const reportEmployeeOutlierModel = {
    findAll: outlierFindAll,
  } as unknown as typeof import('../report-employee/models/report-employee-outlier.model').ReportEmployeeOutlierModel

  const service = new ReportService(
    logger,
    reportModel,
    reportEventModel,
    reportRoleResultModel,
    reportEmployeeOutlierModel,
  )
  return {
    service,
    findAndCountAll,
    findByPkOrThrow,
    roleResultFindAll,
    outlierFindAll,
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
    it('adds an Op.or across identifier, contact name, contact email, company name, kennitala', async () => {
      const { service, findAndCountAll } = makeService()
      findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 })

      await service.list(baseQuery({ q: 'Blámi' }))
      const where = findAndCountAll.mock.calls[0][0].where as Record<
        symbol,
        unknown
      >

      const orBranches = where[Op.or] as Array<Record<string, unknown>>
      expect(orBranches).toHaveLength(5)
      const keys = orBranches.map((b) => Object.keys(b)[0])
      expect(keys).toEqual(
        expect.arrayContaining([
          'identifier',
          'contactName',
          'contactEmail',
          '$companyReport.name$',
          '$companyReport.national_id$',
        ]),
      )
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
      averageEmployeeCountFromRsk: 45,
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
      const { service, findByPkOrThrow, roleResultFindAll, outlierFindAll } =
        makeService()
      findByPkOrThrow.mockResolvedValueOnce(
        makeDetailedReportRow({
          type: ReportTypeEnum.EQUALITY,
          result: null,
        }) as unknown as ReportModel,
      )

      const detail = await service.getById(baseReport.id)

      expect(detail.result).toBeNull()
      expect(detail.roleResults).toEqual([])
      expect(detail.employeeOutliers).toEqual([])
      expect(roleResultFindAll).not.toHaveBeenCalled()
      expect(outlierFindAll).not.toHaveBeenCalled()
    })

    it('returns null/empty calc blocks for salary reports before scoring has run (result missing)', async () => {
      const { service, findByPkOrThrow, roleResultFindAll, outlierFindAll } =
        makeService()
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
      expect(detail.employeeOutliers).toEqual([])
      expect(roleResultFindAll).not.toHaveBeenCalled()
      expect(outlierFindAll).not.toHaveBeenCalled()
    })

    it('loads role results and employee outliers when result exists on salary report', async () => {
      const { service, findByPkOrThrow, roleResultFindAll, outlierFindAll } =
        makeService()

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
      const outlierRow = withFromModel({
        id: 'd1',
        reportEmployeeId: 'e1',
        reason: 'Seniority premium',
        action: 'Reviewed and accepted',
        signatureName: 'Admin',
        signatureRole: 'HR',
      })
      roleResultFindAll.mockResolvedValueOnce([roleResultRow])
      outlierFindAll.mockResolvedValueOnce([outlierRow])

      const detail = await service.getById(baseReport.id)

      expect(detail.result).toEqual(
        expect.objectContaining({ id: resultId, averageSalary: 950 }),
      )
      expect(detail.roleResults).toHaveLength(1)
      expect(detail.roleResults[0]).toEqual(
        expect.objectContaining({ reportResultId: resultId }),
      )
      expect(detail.employeeOutliers).toHaveLength(1)
      expect(detail.employeeOutliers[0]).toEqual(
        expect.objectContaining({ reason: 'Seniority premium' }),
      )

      expect(roleResultFindAll).toHaveBeenCalledWith({
        where: { reportResultId: resultId },
      })
      expect(outlierFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.any(Array),
        }),
      )
    })
  })
})
