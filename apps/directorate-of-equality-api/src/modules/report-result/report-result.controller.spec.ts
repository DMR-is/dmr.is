import { ReportResultController } from './report-result.controller'

describe('ReportResultController', () => {
  it('returns the persisted report result from the service', async () => {
    // Shape follows `ReportResultDto`: one `salary` snapshot (the base/full pair
    // collapsed when the pay model went hourly) plus the frozen decomposition.
    // There is deliberately no `outlierAnalysis` — the ±1,95% band retired with
    // it.
    const getByReportId = jest.fn().mockResolvedValue({
      id: 'result-1',
      reportId: 'report-1',
      salaryDifferenceThresholdPercent: 3.9,
      calculationVersion: 'v2',
      salary: {
        totals: { overall: { average: 5000 } },
        scoreBuckets: [],
      },
      wageGapDecomposition: {
        oskyrtAvailable: true,
        oskyrtPercent: 4.2,
        minimumSetSize: 3,
        benchmarkPercent: 3.9,
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
