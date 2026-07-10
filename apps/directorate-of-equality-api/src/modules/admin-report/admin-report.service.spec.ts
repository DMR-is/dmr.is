import { InternalServerErrorException } from '@nestjs/common'

import { ICompanyService } from '../company/company.service.interface'
import { IConfigService } from '../config/config.service.interface'
import { IReportService } from '../report/report.service.interface'
import { IReportCreateService } from '../report-create/report-create.service.interface'
import { SalaryAnalysisRequestDto } from '../report-statistics/dto/salary-analysis.request.dto'
import * as salaryAnalysisLib from '../report-statistics/lib/salary-analysis'
import { AdminReportService } from './admin-report.service'

// Isolate the service from the (already unit-tested) shared compute so these
// tests only assert the service's own responsibility: read the threshold from
// config and hand the parsed payload + threshold to the shared analyzer.
jest.mock('../report-statistics/lib/salary-analysis', () => {
  const actual = jest.requireActual('../report-statistics/lib/salary-analysis')
  return { ...actual, analyzeSalaryPayload: jest.fn() }
})

const analyzeSalaryPayloadMock =
  salaryAnalysisLib.analyzeSalaryPayload as jest.Mock

describe('AdminReportService.analyzeSalary', () => {
  const getByKey = jest.fn()

  const service = new AdminReportService(
    {} as ICompanyService,
    {} as IReportService,
    {} as IReportCreateService,
    { getByKey } as unknown as IConfigService,
  )

  const request = {
    parsed: { employees: [], roles: [], criteria: [] },
  } as unknown as SalaryAnalysisRequestDto

  beforeEach(() => {
    jest.clearAllMocks()
    getByKey.mockResolvedValue({
      key: 'salary_difference_threshold_percent',
      value: '3.9',
    })
  })

  it('reads the threshold config and delegates to the shared analyzer', async () => {
    const analysis = { outliers: [], baseSalaryByGenderAndScoreAll: {} }
    analyzeSalaryPayloadMock.mockReturnValue(analysis)

    const result = await service.analyzeSalary('company-id', request)

    expect(getByKey).toHaveBeenCalledWith('salary_difference_threshold_percent')
    expect(analyzeSalaryPayloadMock).toHaveBeenCalledWith(request.parsed, 3.9)
    expect(result).toBe(analysis)
  })

  it('throws when the threshold config value is not numeric', async () => {
    getByKey.mockResolvedValue({
      key: 'salary_difference_threshold_percent',
      value: 'not-a-number',
    })

    await expect(service.analyzeSalary('company-id', request)).rejects.toThrow(
      InternalServerErrorException,
    )
    expect(analyzeSalaryPayloadMock).not.toHaveBeenCalled()
  })
})
