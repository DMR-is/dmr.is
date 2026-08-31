import { BadRequestException } from '@nestjs/common'

import { Paging } from '@dmr.is/shared-dto'

import { GenderEnum, ReportTypeEnum } from '../report/models/report.enums'
import { GetReportOutliersResponseDto } from '../report-employee/dto/get-report-outliers-response.dto'
import { ReportEmployeeOutlierDto } from '../report-employee/dto/report-employee-outlier.dto'
import { SalaryByGenderAndScoreDto } from '../report-statistics/dto/salary-by-gender-and-score.dto'
import { getBrowser } from './lib/browser'
import { ReportPdfService } from './report-pdf.service'

jest.mock('./lib/browser', () => ({ getBrowser: jest.fn() }))

const pdfMock = jest.fn(async () => new Uint8Array([1, 2, 3]))
const closeMock = jest.fn(async () => undefined)

function mockBrowser() {
  ;(getBrowser as jest.Mock).mockResolvedValue({
    newPage: async () => ({
      setContent: jest.fn(async () => undefined),
      addStyleTag: jest.fn(async () => undefined),
      pdf: pdfMock,
    }),
    close: closeMock,
  })
}

const salaryReport = {
  id: 'r1',
  type: ReportTypeEnum.SALARY,
  company: { name: 'Test ehf.', nationalId: '111111-1111' },
  subsidiaries: [],
  equalityReport: { content: '<p>efni</p>' },
}

const statistics: SalaryByGenderAndScoreDto = {
  dataPoints: [],
  regressionLine: { slope: 0, intercept: 0, rSquared: 1 },
  scoreBuckets: [],
  totals: {
    maleAverageSalary: 0,
    femaleAverageSalary: 0,
    overallAverageSalary: 0,
    maleMedianSalary: 0,
    femaleMedianSalary: 0,
    overallMedianSalary: 0,
    wageGapPercent: null,
    maleCount: 0,
    femaleCount: 0,
  },
}

function makePaging(overrides: Partial<Paging> = {}): Paging {
  return {
    page: 1,
    pageSize: 200,
    totalPages: 1,
    totalItems: 0,
    nextPage: null,
    previousPage: null,
    hasNextPage: false,
    hasPreviousPage: false,
    ...overrides,
  }
}

function makeOutlier(
  overrides: Partial<ReportEmployeeOutlierDto> = {},
): ReportEmployeeOutlierDto {
  return {
    id: 'outlier-1',
    reportEmployeeId: 'employee-1',
    employeeOrdinal: 1,
    gender: GenderEnum.FEMALE,
    roleTitle: 'Sérfræðingur',
    score: 500,
    groupId: 'group-1',
    groupName: 'Sérfræðingar',
    reason: 'Skýring á mismun',
    action: 'Úrbót fyrirhuguð',
    signatureName: 'Jón J. Jónsson',
    signatureRole: 'Framkvæmdastjóri',
    regularHourlyWage: 4750,
    expectedHourlyWage: 5000,
    deviationPercent: -5,
    payStatus: 'UNDERPAID',
    contributionShare: 42.5,
    ...overrides,
  }
}

function makeService(reportOverrides = {}) {
  const logger = { debug: jest.fn(), warn: jest.fn() }
  const reportService = {
    getById: jest.fn(async () => ({ ...salaryReport, ...reportOverrides })),
    getOutliers: jest.fn(
      async (): Promise<GetReportOutliersResponseDto> => ({
        outliers: [],
        paging: makePaging(),
      }),
    ),
    getOutlierGroups: jest.fn(async () => ({ groups: [] })),
  }
  const statisticsService = {
    getRegularHourlyWageByScoreAll: jest.fn(async () => statistics),
    // Monthly krónur, fetched separately from the rate statistics — see the
    // note on `payComponents` in the salary template.
    getBenefitsBreakdown: jest.fn(async () => ({
      male: {
        averageAdditionalSalary: 0,
        averageBonusSalary: 0,
        averageTotal: 0,
        count: 0,
      },
      female: {
        averageAdditionalSalary: 0,
        averageBonusSalary: 0,
        averageTotal: 0,
        count: 0,
      },
      overall: {
        averageAdditionalSalary: 0,
        averageBonusSalary: 0,
        averageTotal: 0,
        count: 0,
      },
      additionalWageGapPercent: null,
      bonusWageGapPercent: null,
      totalWageGapPercent: null,
    })),
  }

  const service = new ReportPdfService(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reportService as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    statisticsService as any,
  )

  return { service, reportService, statisticsService }
}

describe('ReportPdfService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBrowser()
  })

  describe('generateReportPdf', () => {
    it('renders a salary report, fetching statistics and outliers', async () => {
      const { service, reportService, statisticsService } = makeService()

      const result = await service.generateReportPdf('r1')

      expect(Buffer.isBuffer(result.pdf)).toBe(true)
      expect(result.fileName).toBe('launagreining-r1.pdf')
      expect(reportService.getById).toHaveBeenCalledWith('r1')
      expect(
        statisticsService.getRegularHourlyWageByScoreAll,
      ).toHaveBeenCalledWith('r1')
      expect(reportService.getOutliers).toHaveBeenCalled()
      expect(closeMock).toHaveBeenCalled()
    })

    it('renders an equality report without fetching salary statistics or outliers', async () => {
      const { service, reportService, statisticsService } = makeService({
        type: ReportTypeEnum.EQUALITY,
      })

      const result = await service.generateReportPdf('r1')

      expect(Buffer.isBuffer(result.pdf)).toBe(true)
      expect(result.fileName).toBe('jafnrettisaaetlun-r1.pdf')
      expect(
        statisticsService.getRegularHourlyWageByScoreAll,
      ).not.toHaveBeenCalled()
      expect(reportService.getOutliers).not.toHaveBeenCalled()
    })

    it('rejects reports with an unsupported type', async () => {
      const { service } = makeService({ type: 'UNKNOWN' })

      await expect(service.generateReportPdf('r1')).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('paginates through all outlier pages for salary reports', async () => {
      const { service, reportService } = makeService()
      reportService.getOutliers
        .mockResolvedValueOnce({
          outliers: Array.from({ length: 200 }, () =>
            makeOutlier({ employeeOrdinal: 1 }),
          ),
          paging: makePaging({
            totalPages: 2,
            totalItems: 250,
            nextPage: 2,
            hasNextPage: true,
          }),
        })
        .mockResolvedValueOnce({
          outliers: Array.from({ length: 50 }, () =>
            makeOutlier({ employeeOrdinal: 2 }),
          ),
          paging: makePaging({
            page: 2,
            totalPages: 2,
            totalItems: 250,
            previousPage: 1,
            hasPreviousPage: true,
          }),
        })

      await service.generateReportPdf('r1')

      expect(reportService.getOutliers).toHaveBeenCalledTimes(2)
      expect(reportService.getOutliers).toHaveBeenNthCalledWith(2, 'r1', {
        page: 2,
        pageSize: 200,
      })
    })

    it('closes the browser even when rendering fails', async () => {
      const { service } = makeService()
      pdfMock.mockRejectedValueOnce(new Error('boom'))

      await expect(service.generateReportPdf('r1')).rejects.toThrow('boom')
      expect(closeMock).toHaveBeenCalled()
    })
  })

  describe('generateImprovementPlanPdf', () => {
    it('renders one outlier query per group, scoped by groupId', async () => {
      const { service, reportService } = makeService()
      reportService.getOutlierGroups.mockResolvedValue({
        groups: [
          { id: 'g1', name: 'Hópur A', reason: 'r', action: 'a' },
          { id: 'g2', name: 'Hópur B', reason: 'r', action: 'a' },
        ],
      })

      const result = await service.generateImprovementPlanPdf('r1')

      expect(result).not.toBeNull()
      expect(result?.fileName).toBe('urbotaaetlun-r1.pdf')
      // ⚠️ The `groupId` is the whole reason this document exists: without it
      // every group collapses into one flat table.
      expect(reportService.getOutliers).toHaveBeenCalledWith(
        'r1',
        expect.objectContaining({ groupId: 'g1' }),
      )
      expect(reportService.getOutliers).toHaveBeenCalledWith(
        'r1',
        expect.objectContaining({ groupId: 'g2' }),
      )
    })

    /**
     * A compliant company has no plan to state, and its salary report already
     * carries that as a finding. A page whose only content is "engir hópar"
     * would read as a plan that failed to print.
     */
    it('returns null when the report has no outlier groups', async () => {
      const { service, reportService } = makeService()
      reportService.getOutlierGroups.mockResolvedValue({ groups: [] })

      await expect(service.generateImprovementPlanPdf('r1')).resolves.toBeNull()
      expect(reportService.getOutliers).not.toHaveBeenCalled()
    })

    it('rejects an equality report, which has no outlier groups', async () => {
      const { service } = makeService({ type: ReportTypeEnum.EQUALITY })

      await expect(
        service.generateImprovementPlanPdf('r1'),
      ).rejects.toThrow(/not a salary report/)
    })
  })
})
