import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { ConfigModel } from '../config/models/config.model'
import {
  GenderEnum,
  ReportModel,
  ReportTypeEnum,
} from '../report/models/report.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportResultModel } from './models/report-result.model'
import { ReportResultService } from './report-result.service'

const REPORT_ID = '00000000-0000-0000-0000-000000000011'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('ReportResultService', () => {
  let service: ReportResultService
  let reportFindOne: jest.Mock
  let employeeFindAll: jest.Mock
  let resultFindOne: jest.Mock
  let resultCreate: jest.Mock
  let configFindOne: jest.Mock

  beforeEach(async () => {
    reportFindOne = jest.fn()
    employeeFindAll = jest.fn()
    resultFindOne = jest.fn()
    resultCreate = jest.fn()
    configFindOne = jest.fn()

    const module = await Test.createTestingModule({
      providers: [
        ReportResultService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: getModelToken(ReportModel),
          useValue: { findOne: reportFindOne },
        },
        {
          provide: getModelToken(ReportEmployeeModel),
          useValue: { findAll: employeeFindAll },
        },
        {
          provide: getModelToken(ReportResultModel),
          useValue: { findOne: resultFindOne, create: resultCreate },
        },
        {
          provide: getModelToken(ConfigModel),
          useValue: { findOne: configFindOne },
        },
      ],
    }).compile()

    service = module.get(ReportResultService)
  })

  it('creates and returns a persisted report result snapshot', async () => {
    reportFindOne.mockResolvedValue({
      id: REPORT_ID,
      type: ReportTypeEnum.SALARY,
    })
    resultFindOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'result-1',
      reportId: REPORT_ID,
      fromModel: jest.fn().mockReturnValue({
        id: 'result-1',
        reportId: REPORT_ID,
        salaryDifferenceThresholdPercent: 3.9,
        calculationVersion: 'v2',
        salary: {
          totals: { overall: { average: 3125 } },
          scoreBuckets: [],
        },
      }),
    })
    employeeFindAll.mockResolvedValue([
      makeEmployee(
        1,
        'role-b',
        120,
        GenderEnum.MALE,
        200,
        400000,
        100000,
        50000,
      ),
      makeEmployee(
        2,
        'role-a',
        220,
        GenderEnum.FEMALE,
        100,
        300000,
        50000,
        null,
      ),
    ])
    configFindOne.mockResolvedValue({ value: '3.9' })
    resultCreate.mockResolvedValue({ id: 'result-1' })

    const result = await service.createForReport(REPORT_ID)

    expect(resultCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: REPORT_ID,
        salaryDifferenceThresholdPercent: 3.9,
        calculationVersion: 'v2',
        salarySnapshot: expect.objectContaining({
          totals: expect.objectContaining({
            overall: expect.objectContaining({ average: 3125 }),
            male: expect.objectContaining({ average: 2750 }),
            female: expect.objectContaining({ average: 3500 }),
          }),
          scoreBuckets: expect.arrayContaining([
            expect.objectContaining({
              rangeFrom: 100,
              rangeTo: 200,
              counts: expect.objectContaining({ male: 1, female: 0 }),
            }),
            expect.objectContaining({
              rangeFrom: 200,
              rangeTo: 300,
              counts: expect.objectContaining({ male: 0, female: 1 }),
            }),
          ]),
        }),
      }),
    )
    expect(result.salary.totals.overall.average).toBe(3125)
  })

  /**
   * Guards the wiring, not the maths — the decomposition's own behaviour is
   * covered in `wage-gap-decomposition.spec.ts`. Without this the snapshot could
   * stop being persisted entirely and every assertion above would still pass,
   * because `objectContaining` ignores absent keys.
   */
  it('persists the wage-gap decomposition alongside the other snapshots', async () => {
    reportFindOne.mockResolvedValue({
      id: REPORT_ID,
      type: ReportTypeEnum.SALARY,
    })
    resultFindOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'result-1',
      reportId: REPORT_ID,
      fromModel: jest.fn().mockReturnValue({ id: 'result-1' }),
    })
    employeeFindAll.mockResolvedValue([
      makeEmployee(
        1,
        'role-b',
        120,
        GenderEnum.MALE,
        200,
        400000,
        100000,
        50000,
      ),
      makeEmployee(
        2,
        'role-a',
        220,
        GenderEnum.FEMALE,
        100,
        300000,
        50000,
        null,
      ),
    ])
    configFindOne.mockResolvedValue({ value: '3.9' })
    resultCreate.mockResolvedValue({ id: 'result-1' })

    await service.createForReport(REPORT_ID)

    const persisted = resultCreate.mock.calls[0][0]

    // The benchmark is read from the SAME config key as the outlier threshold —
    // one value, not two that must be kept equal by hand.
    expect(persisted.wageGapDecompositionSnapshot.benchmarkPercent).toBe(3.9)
    expect(persisted.wageGapDecompositionSnapshot.oskyrtAvailable).toBe(true)
    expect(persisted.wageGapDecompositionSnapshot.counts).toEqual({
      male: 1,
      female: 1,
      excluded: 0,
    })

    // Two employees, one covariate ⇒ the line passes through both points
    // exactly, so every residual is 0 and NOTHING is left unexplained: the whole
    // raw gap is attributed to the score difference. Degenerate, but the correct
    // answer, and worth pinning so it is not mistaken for a broken fit.
    expect(persisted.wageGapDecompositionSnapshot.oskyrtLog).toBeCloseTo(0, 9)
    expect(persisted.wageGapDecompositionSnapshot.minimumSetSize).toBe(0)
    expect(
      persisted.wageGapDecompositionSnapshot.twofold.explained,
    ).toBeCloseTo(persisted.wageGapDecompositionSnapshot.rawGapLog, 9)

    // The part-timer earns the higher hourly rate, so the raw gap disfavours men.
    expect(persisted.wageGapDecompositionSnapshot.rawGapDirection).toBe('MALE')
  })

  it('rejects non-salary reports', async () => {
    reportFindOne.mockResolvedValue({
      id: REPORT_ID,
      type: ReportTypeEnum.EQUALITY,
    })

    await expect(service.createForReport(REPORT_ID)).rejects.toThrow(
      BadRequestException,
    )
  })

  it('rejects duplicate report results', async () => {
    reportFindOne.mockResolvedValue({
      id: REPORT_ID,
      type: ReportTypeEnum.SALARY,
    })
    resultFindOne.mockResolvedValue({ id: 'existing-result' })

    await expect(service.createForReport(REPORT_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it('rejects reports without employees', async () => {
    reportFindOne.mockResolvedValue({
      id: REPORT_ID,
      type: ReportTypeEnum.SALARY,
    })
    resultFindOne.mockResolvedValue(null)
    employeeFindAll.mockResolvedValue([])

    await expect(service.createForReport(REPORT_ID)).rejects.toThrow(
      NotFoundException,
    )
  })

  it('returns persisted result rows through getByReportId', async () => {
    resultFindOne.mockResolvedValue({
      id: 'result-1',
      reportId: REPORT_ID,
      fromModel: jest.fn().mockReturnValue({
        id: 'result-1',
        reportId: REPORT_ID,
        salaryDifferenceThresholdPercent: 3.9,
        calculationVersion: 'v2',
        salary: {
          totals: { overall: { average: 3125 } },
          scoreBuckets: [],
        },
      }),
    })

    const result = await service.getByReportId(REPORT_ID)

    expect(result.salary.totals.overall.average).toBe(3125)
  })
})

function makeEmployee(
  ordinal: number,
  reportEmployeeRoleId: string,
  score: number,
  gender: GenderEnum,
  paidHours: number,
  baseSalary: number,
  additionalSalary: number,
  bonusSalary: number | null,
) {
  return {
    ordinal,
    reportEmployeeRoleId,
    score,
    gender,
    paidHours,
    baseSalary,
    // Plain object cast to the model: the derived getters don't fire, so keep
    // the parent totals as explicit own-properties for the service to read.
    additionalSalary,
    bonusSalary,
    additionalFixedOvertime: null,
    additionalFixedCarAllowance: null,
    bonusOccasionalCarAllowance: null,
    bonusOccasionalOvertime: null,
    bonusPayments: null,
    bonusOther: null,
  } as unknown as ReportEmployeeModel
}
