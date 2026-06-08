import { BadRequestException } from '@nestjs/common'

import { ReportTypeEnum } from '../report/models/report.enums'
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

const statistics = {
  dataPoints: [],
  regressionLine: { slope: 0, intercept: 0 },
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

function makeService(reportOverrides = {}) {
  const logger = { debug: jest.fn(), warn: jest.fn() }
  const reportService = {
    getById: jest.fn(async () => ({ ...salaryReport, ...reportOverrides })),
    getOutliers: jest.fn(async () => ({
      outliers: [],
      paging: { page: 1, pageSize: 200, totalPages: 1, totalItems: 0 },
    })),
  }
  const statisticsService = {
    getBaseSalaryByGenderAndScoreAll: jest.fn(async () => statistics),
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

  describe('generateSalaryReportPdf', () => {
    it('fetches data, renders, and returns a PDF buffer', async () => {
      const { service, reportService, statisticsService } = makeService()

      const result = await service.generateSalaryReportPdf('r1')

      expect(Buffer.isBuffer(result)).toBe(true)
      expect(reportService.getById).toHaveBeenCalledWith('r1')
      expect(
        statisticsService.getBaseSalaryByGenderAndScoreAll,
      ).toHaveBeenCalledWith('r1')
      expect(reportService.getOutliers).toHaveBeenCalled()
      expect(closeMock).toHaveBeenCalled()
    })

    it('rejects non-salary reports', async () => {
      const { service } = makeService({ type: ReportTypeEnum.EQUALITY })

      await expect(service.generateSalaryReportPdf('r1')).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('paginates through all outlier pages', async () => {
      const { service, reportService } = makeService()
      reportService.getOutliers
        .mockResolvedValueOnce({
          outliers: new Array(200).fill({ employeeOrdinal: 1 }),
          paging: { page: 1, pageSize: 200, totalPages: 2, totalItems: 250 },
        })
        .mockResolvedValueOnce({
          outliers: new Array(50).fill({ employeeOrdinal: 2 }),
          paging: { page: 2, pageSize: 200, totalPages: 2, totalItems: 250 },
        })

      await service.generateSalaryReportPdf('r1')

      expect(reportService.getOutliers).toHaveBeenCalledTimes(2)
      expect(reportService.getOutliers).toHaveBeenNthCalledWith(2, 'r1', {
        page: 2,
        pageSize: 200,
      })
    })
  })

  describe('generateEqualityReportPdf', () => {
    it('returns a PDF buffer without fetching salary statistics', async () => {
      const { service, statisticsService } = makeService()

      const result = await service.generateEqualityReportPdf('r1')

      expect(Buffer.isBuffer(result)).toBe(true)
      expect(
        statisticsService.getBaseSalaryByGenderAndScoreAll,
      ).not.toHaveBeenCalled()
    })
  })

  it('closes the browser even when rendering fails', async () => {
    const { service } = makeService()
    pdfMock.mockRejectedValueOnce(new Error('boom'))

    await expect(service.generateSalaryReportPdf('r1')).rejects.toThrow('boom')
    expect(closeMock).toHaveBeenCalled()
  })
})
