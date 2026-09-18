import { InternalServerErrorException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { ReportModel } from '../report/models/report.model'
import { ReportIdentifierService } from './report-identifier.service'

describe('ReportIdentifierService', () => {
  let service: ReportIdentifierService
  let reportCount: jest.Mock
  let warn: jest.Mock

  beforeEach(async () => {
    reportCount = jest.fn().mockResolvedValue(0)
    warn = jest.fn()

    const module = await Test.createTestingModule({
      providers: [
        ReportIdentifierService,
        {
          provide: LOGGER_PROVIDER,
          useValue: {
            debug: jest.fn(),
            info: jest.fn(),
            warn,
            error: jest.fn(),
          },
        },
        {
          provide: getModelToken(ReportModel),
          useValue: { count: reportCount },
        },
      ],
    }).compile()

    service = module.get(ReportIdentifierService)
  })

  it('mints a six-letter code and checks it is unused', async () => {
    const identifier = await service.allocate()

    expect(identifier).toMatch(/^[A-Z]{6}$/)
    expect(reportCount).toHaveBeenCalledWith({ where: { identifier } })
  })

  it('retries past a collision and returns a free code', async () => {
    // 1st candidate is taken, 2nd is free.
    reportCount.mockResolvedValueOnce(1).mockResolvedValueOnce(0)

    const identifier = await service.allocate()

    expect(identifier).toMatch(/^[A-Z]{6}$/)
    expect(reportCount).toHaveBeenCalledTimes(2)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('gives up rather than issuing a duplicate when every candidate collides', async () => {
    reportCount.mockResolvedValue(1)

    await expect(service.allocate()).rejects.toThrow(
      InternalServerErrorException,
    )
  })
})
