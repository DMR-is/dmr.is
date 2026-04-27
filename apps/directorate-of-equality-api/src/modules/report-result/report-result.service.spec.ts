import { Sequelize } from 'sequelize-typescript'

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
  let sequelizeTransaction: jest.Mock

  beforeEach(async () => {
    reportFindOne = jest.fn()
    employeeFindAll = jest.fn()
    resultFindOne = jest.fn()
    resultCreate = jest.fn()
    configFindOne = jest.fn()
    sequelizeTransaction = jest.fn(async (callback) => callback({ id: 'tx-1' }))

    const module = await Test.createTestingModule({
      providers: [
        ReportResultService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: Sequelize, useValue: { transaction: sequelizeTransaction } },
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
    resultFindOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'result-1',
        reportId: REPORT_ID,
        fromModel: jest.fn().mockReturnValue({
          id: 'result-1',
          reportId: REPORT_ID,
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
        }),
      })
    employeeFindAll.mockResolvedValue([
      makeEmployee('role-b', 120, GenderEnum.MALE, 1, 400000, 100000, 50000),
      makeEmployee('role-a', 220, GenderEnum.FEMALE, 0.5, 300000, 50000, null),
    ])
    configFindOne.mockResolvedValue({ value: '3.9' })
    resultCreate.mockResolvedValue({ id: 'result-1' })

    const result = await service.createForReport(REPORT_ID)

    expect(sequelizeTransaction).toHaveBeenCalled()
    expect(resultCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: REPORT_ID,
        salaryDifferenceThresholdPercent: 3.9,
        calculationVersion: 'v1',
        baseSnapshot: expect.objectContaining({
          totals: expect.objectContaining({
            overall: expect.objectContaining({ average: 500000 }),
            male: expect.objectContaining({ average: 400000 }),
            female: expect.objectContaining({ average: 600000 }),
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
        fullSnapshot: expect.objectContaining({
          totals: expect.objectContaining({
            overall: expect.objectContaining({ average: 625000 }),
          }),
        }),
      }),
      expect.objectContaining({ transaction: { id: 'tx-1' } }),
    )
    expect(result.base.totals.overall.average).toBe(500000)
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
        calculationVersion: 'v1',
        base: {
          totals: { overall: { average: 500000 } },
          scoreBuckets: [],
        },
        full: {
          totals: { overall: { average: 625000 } },
          scoreBuckets: [],
        },
      }),
    })

    const result = await service.getByReportId(REPORT_ID)

    expect(result.base.totals.overall.average).toBe(500000)
  })
})

function makeEmployee(
  reportEmployeeRoleId: string,
  score: number,
  gender: GenderEnum,
  workRatio: number,
  baseSalary: number,
  additionalSalary: number,
  bonusSalary: number | null,
) {
  return {
    reportEmployeeRoleId,
    score,
    gender,
    workRatio,
    baseSalary,
    additionalSalary,
    bonusSalary,
  } as ReportEmployeeModel
}
