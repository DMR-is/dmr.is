import { Test, TestingModule } from '@nestjs/testing'
import { StatisticsController } from './statistics.controller'
import { IStatisticsService } from './statistics.service.interface'
import { MockStatisticsService } from './statistics.service.mock'
import { ALL_MOCK_JOURNAL_DEPARTMENTS } from '../../mock/journal.mock'
import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { StatisticsOverviewQueryType } from '../../dto/statistics/statistics-overview-query.dto'
import { NotImplementedException } from '@nestjs/common'

describe('StatisticsController', () => {
  let statistics: TestingModule
  let controller: StatisticsController

  beforeAll(async () => {
    statistics = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [
        {
          provide: LOGGER_PROVIDER,
          useValue: {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: IStatisticsService,
          useClass: MockStatisticsService,
        },
      ],
    }).compile()
    controller = statistics.get<StatisticsController>(StatisticsController)
  })

  describe('department', () => {
    const idWithNoStatistics = ALL_MOCK_JOURNAL_DEPARTMENTS[0].id
    const idWithStatistics = ALL_MOCK_JOURNAL_DEPARTMENTS[1].id

    it('Should return total adverts equal to 0', async () => {
      const results = await controller.department({ id: idWithNoStatistics })
      expect(results.totalAdverts).toEqual(0)
    })

    it('Should return total adverts larger than 0', async () => {
      const results = await controller.department({ id: idWithStatistics })
      expect(results.totalAdverts).toBeGreaterThan(0)
    })

    it('Should return a bad request when missing parameter', async () => {
      expect(async () => {
        await controller.department()
      }).rejects.toThrow('Missing parameters')
    })
  })

  describe('overview', () => {
    it('Should return bad request when missing parameter', async () => {
      expect(async () => {
        await controller.overview()
      }).rejects.toThrow('Missing parameters')
    })

    it('Should return total count larger than 0', async () => {
      const results = await controller.overview({
        type: StatisticsOverviewQueryType.General,
      })
      expect(results.totalAdverts).toEqual(0)
    })

    it('Should throw not implemented error', async () => {
      try {
        await controller.overview({ type: StatisticsOverviewQueryType.General })
      } catch (error) {
        if (error instanceof NotImplementedException) {
          expect(error.message).toEqual('Not Implemented')
          expect(error.getStatus()).toEqual(501)
        }
      }
    })
  })
})
