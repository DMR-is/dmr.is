import { ReportResultController } from './report-result.controller'

describe('ReportResultController', () => {
  it('returns the persisted report result from the service', async () => {
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
    })

    const controller = new ReportResultController({
      getByReportId,
    })
    const result = await controller.getByReportId('report-1')

    expect(getByReportId).toHaveBeenCalledWith('report-1')
    expect(result.reportId).toBe('report-1')
  })
})
