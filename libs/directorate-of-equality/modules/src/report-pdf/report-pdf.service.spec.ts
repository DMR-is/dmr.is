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

/** Captures the `setContent` calls so the wait strategy can be asserted. */
const setContentMock = jest.fn(async () => undefined)

const setJavaScriptEnabledMock = jest.fn(async () => undefined)
const setRequestInterceptionMock = jest.fn(async () => undefined)

/**
 * The `request` handler the service registers, captured so the tests can drive
 * it with URLs directly. Puppeteer would otherwise only invoke it against a
 * real page, which these tests deliberately do not have.
 */
let requestHandler: ((request: FakeRequest) => void) | null = null

type FakeRequest = {
  url: () => string
  continue: jest.Mock
  abort: jest.Mock
}

function makeRequest(url: string): FakeRequest {
  return { url: () => url, continue: jest.fn(), abort: jest.fn() }
}

function mockBrowser() {
  requestHandler = null
  ;(getBrowser as jest.Mock).mockResolvedValue({
    newPage: async () => ({
      setContent: setContentMock,
      setJavaScriptEnabled: setJavaScriptEnabledMock,
      setRequestInterception: setRequestInterceptionMock,
      on: (event: string, handler: (request: FakeRequest) => void) => {
        if (event === 'request') requestHandler = handler
      },
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

  /**
   * ⚠️ Regression guard. These documents are self-contained — inline SVG,
   * injected styles, nothing fetched — so there is no network to go idle, and
   * `networkidle0` waits for a silent window some Chromium builds never report
   * for such a page. It then fails the render with `Navigation timeout of 30000
   * ms exceeded`. Confirmed locally: `networkidle0`/`networkidle2` time out
   * against `/Applications/Chromium.app` while `load` produces a byte-identical
   * PDF in ~1.5s.
   *
   * This matters beyond a failed download: the approval path renders inside the
   * reviewer's request and swallows failures, so a hang means the company is
   * never told its report was approved.
   */
  it('waits for load, never for network idle', async () => {
    const { service } = makeService()

    await service.generateReportPdf('r1')

    expect(setContentMock).toHaveBeenCalledWith(expect.any(String), {
      waitUntil: 'load',
    })
  })

  /*
   * The renderer runs `--no-sandbox` Chromium inside the API container, and the
   * equality report's body is applicant-supplied markup. `equality-report-
   * template.spec.ts` covers the sanitising that keeps script out of the HTML;
   * these cover the second layer, which also stops a subresource fetch that
   * sanitising permits — `<img src="http://…">` survives the allow-list, and
   * `waitUntil: 'load'` would fetch it.
   */
  describe('renderer hardening', () => {
    it('disables JavaScript before setting the page content', async () => {
      const { service } = makeService()

      await service.generateReportPdf('r1')

      expect(setJavaScriptEnabledMock).toHaveBeenCalledWith(false)
      expect(setJavaScriptEnabledMock.mock.invocationCallOrder[0]).toBeLessThan(
        setContentMock.mock.invocationCallOrder[0],
      )
    })

    it('enables request interception before setting the page content', async () => {
      const { service } = makeService()

      await service.generateReportPdf('r1')

      expect(setRequestInterceptionMock).toHaveBeenCalledWith(true)
      expect(
        setRequestInterceptionMock.mock.invocationCallOrder[0],
      ).toBeLessThan(setContentMock.mock.invocationCallOrder[0])
    })

    it.each([
      ['http://169.254.169.254/latest/meta-data/', 'the metadata endpoint'],
      ['http://localhost:4100/api/v1/reports', 'an internal service'],
      ['https://example.com/beacon.png', 'an external beacon'],
      ['file:///etc/passwd', 'a local file'],
    ])('aborts %s (%s)', async (url) => {
      const { service } = makeService()
      await service.generateReportPdf('r1')

      const request = makeRequest(url)
      requestHandler?.(request)

      expect(request.abort).toHaveBeenCalled()
      expect(request.continue).not.toHaveBeenCalled()
    })

    it.each([
      ['data:image/png;base64,iVBORw0KGgo=', 'an inline image'],
      ['about:blank', 'the document setContent writes into'],
    ])('allows %s (%s)', async (url) => {
      const { service } = makeService()
      await service.generateReportPdf('r1')

      const request = makeRequest(url)
      requestHandler?.(request)

      expect(request.continue).toHaveBeenCalled()
      expect(request.abort).not.toHaveBeenCalled()
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

      // Groups must actually have members — a memberless set is the data-fault
      // state the service now declines to render.
      // Uses the file's own helper rather than an ad-hoc literal: specs are
      // type-checked by neither `tsconfig.lib.json` (which excludes them) nor
      // ts-jest (`diagnostics: false`), so a partial DTO here is invisible.
      reportService.getOutliers.mockResolvedValue({
        outliers: [makeOutlier({ employeeOrdinal: 1 })],
        paging: makePaging(),
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

    /**
     * Groups with nothing assigned is a data fault, not a plan. Attaching a
     * document reading "Engir starfsmenn skráðir í þennan hóp" beside a salary
     * report rendering "Engar úrbætur nauðsynlegar" would tell the company two
     * different things in one email.
     */
    it('returns null when groups exist but none has members', async () => {
      const { service, reportService } = makeService()
      reportService.getOutlierGroups.mockResolvedValue({
        groups: [{ id: 'g1', name: 'Hópur A', reason: 'r', action: 'a' }],
      })
      reportService.getOutliers.mockResolvedValue({
        outliers: [],
        paging: makePaging(),
      })

      await expect(service.generateImprovementPlanPdf('r1')).resolves.toBeNull()
    })

    it('rejects an equality report, which has no outlier groups', async () => {
      const { service } = makeService({ type: ReportTypeEnum.EQUALITY })

      await expect(service.generateImprovementPlanPdf('r1')).rejects.toThrow(
        /not a salary report/,
      )
    })
  })
})
