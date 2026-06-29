import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { ReportTypeEnum } from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import { AutoReviewDecisionEnum } from '../report/models/report-event.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportResultModel } from '../report-result/models/report-result.model'
import { ReportAutoReviewService } from './report-auto-review.service'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const REPORT_ID = 'report-1'
const PREVIOUS_REPORT_ID = 'report-0'

// Builds a persisted-result row exposing just the male/female base-pay gap the
// evaluator reads.
const resultWithGap = (maleFemale: number | null) => ({
  baseSnapshot: { totals: { salaryDifferences: { maleFemale } } },
})

describe('ReportAutoReviewService', () => {
  let service: ReportAutoReviewService
  let reportFindOne: jest.Mock
  let resultFindOne: jest.Mock
  let employeeCount: jest.Mock
  let outlierCount: jest.Mock

  beforeEach(async () => {
    reportFindOne = jest.fn()
    resultFindOne = jest.fn()
    employeeCount = jest.fn()
    outlierCount = jest.fn()

    const module = await Test.createTestingModule({
      providers: [
        ReportAutoReviewService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: getModelToken(ReportModel), useValue: { findOne: reportFindOne } },
        {
          provide: getModelToken(ReportResultModel),
          useValue: { findOne: resultFindOne },
        },
        {
          provide: getModelToken(ReportEmployeeModel),
          useValue: { count: employeeCount },
        },
        {
          provide: getModelToken(ReportEmployeeOutlierModel),
          useValue: { count: outlierCount },
        },
      ],
    }).compile()

    service = module.get(ReportAutoReviewService)
  })

  // Arranges a salary report with `total` employees, `outliers` flagged, a
  // current male/female gap, and optionally a previous approved report + gap.
  const arrangeSalary = (opts: {
    total: number
    outliers: number
    gap: number | null
    previousGap?: number | null
  }) => {
    reportFindOne.mockResolvedValueOnce({
      id: REPORT_ID,
      type: ReportTypeEnum.SALARY,
      companyNationalId: '5500000000',
    })
    employeeCount.mockResolvedValue(opts.total)
    outlierCount.mockResolvedValue(opts.outliers)

    // First result lookup = current report's gap.
    resultFindOne.mockResolvedValueOnce(resultWithGap(opts.gap))

    if (opts.previousGap === undefined) {
      // No previous approved report.
      reportFindOne.mockResolvedValueOnce(null)
    } else {
      reportFindOne.mockResolvedValueOnce({ id: PREVIOUS_REPORT_ID })
      resultFindOne.mockResolvedValueOnce(resultWithGap(opts.previousGap))
    }
  }

  it('abstains (NEEDS_REVIEW) for EQUALITY reports without touching salary signals', async () => {
    reportFindOne.mockResolvedValueOnce({
      id: REPORT_ID,
      type: ReportTypeEnum.EQUALITY,
    })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.NEEDS_REVIEW)
    expect(verdict.signals.reportType).toBe(ReportTypeEnum.EQUALITY)
    expect(employeeCount).not.toHaveBeenCalled()
    expect(outlierCount).not.toHaveBeenCalled()
  })

  it('abstains when the report cannot be found', async () => {
    reportFindOne.mockResolvedValueOnce(null)

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.NEEDS_REVIEW)
  })

  it('auto-approves a salary report with no outliers', async () => {
    arrangeSalary({ total: 20, outliers: 0, gap: 0 })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.AUTO_APPROVE)
    expect(verdict.signals.outlierEmployees).toBe(0)
  })

  it('auto-approves outliers within bounds when there is no prior report', async () => {
    arrangeSalary({ total: 20, outliers: 1, gap: 3 })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.AUTO_APPROVE)
    expect(verdict.signals.outlierRatio).toBeCloseTo(0.05)
    expect(verdict.signals.gapImproved).toBeNull()
  })

  it('routes to review when the outlier share exceeds the threshold', async () => {
    arrangeSalary({ total: 10, outliers: 3, gap: 2 })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.NEEDS_REVIEW)
    expect(verdict.reason).toContain('hlutfall frávika')
  })

  it('routes to review when the pay gap exceeds the threshold', async () => {
    arrangeSalary({ total: 20, outliers: 1, gap: 8 })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.NEEDS_REVIEW)
    expect(verdict.reason).toContain('launamunur')
  })

  it('uses the absolute gap so a large negative gap still trips the threshold', async () => {
    arrangeSalary({ total: 20, outliers: 1, gap: -8 })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.NEEDS_REVIEW)
    expect(verdict.signals.gapPercent).toBe(8)
  })

  it('routes to review when the gap worsened versus the previous approved report', async () => {
    arrangeSalary({ total: 20, outliers: 1, gap: 3, previousGap: 2 })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.NEEDS_REVIEW)
    expect(verdict.signals.gapImproved).toBe(false)
    expect(verdict.reason).toContain('jókst')
  })

  it('auto-approves when the gap improved versus the previous approved report', async () => {
    arrangeSalary({ total: 20, outliers: 1, gap: 3, previousGap: 5 })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.AUTO_APPROVE)
    expect(verdict.signals.gapImproved).toBe(true)
    expect(verdict.signals.previousGapPercent).toBe(5)
  })
})
