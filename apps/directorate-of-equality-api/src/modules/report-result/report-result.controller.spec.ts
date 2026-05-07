import { SalaryOutlierAnalysisMethodEnum } from '../report/lib/compensation-aggregates'
import { ReportResultController } from './report-result.controller'

describe('ReportResultController', () => {
  it('returns the persisted report result from the service', async () => {
    const emptyRegression = {
      slope: null,
      intercept: null,
      sampleCount: 0,
      scoreMean: null,
      adjustedBaseSalaryMean: null,
      rSquared: null,
      scoreRangeFrom: null,
      scoreRangeTo: null,
    }
    const getByReportId = jest.fn().mockResolvedValue({
      id: 'result-1',
      reportId: 'report-1',
      salaryDifferenceThresholdPercent: 3.9,
      calculationVersion: 'v1',
      base: {
        totals: { overall: { average: 500000 } },
        scoreBuckets: [],
      },
      full: {
        totals: { overall: { average: 625000 } },
        scoreBuckets: [],
      },
      outlierAnalysis: {
        method:
          SalaryOutlierAnalysisMethodEnum.BASE_SALARY_LINEAR_REGRESSION_BY_SCORE,
        thresholdPercent: 3.9,
        allowedDifferencePercent: 1.95,
        regressions: {
          overall: emptyRegression,
          male: emptyRegression,
          female: emptyRegression,
          neutral: emptyRegression,
        },
        employees: [],
      },
    })

    const controller = new ReportResultController({
      getByReportId,
      createForReport: jest.fn(),
    })
    const result = await controller.getByReportId('report-1')

    expect(getByReportId).toHaveBeenCalledWith('report-1')
    expect(result.reportId).toBe('report-1')
  })
})
