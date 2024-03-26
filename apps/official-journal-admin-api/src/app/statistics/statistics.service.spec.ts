import { Test } from '@nestjs/testing'
import { IStatisticsService } from './statistics.service.interface'
import { LoggingModule } from '@dmr.is/logging'
import { MockStatisticsService } from './statistics.service.mock'

import { NotImplementedException } from '@nestjs/common'
import { ALL_MOCK_JOURNAL_DEPARTMENTS } from '@dmr.is/mocks'
import { StatisticsOverviewQueryType } from '@dmr.is/shared/dto/cases'

describe('StatisticsService', () => {
  let service: IStatisticsService

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggingModule],
      providers: [
        {
          provide: IStatisticsService,
          useClass: MockStatisticsService,
        },
      ],
    }).compile()

    service = app.get<IStatisticsService>(IStatisticsService)
  })

  describe('getStatistics', () => {
    const idWithNoAdverts = ALL_MOCK_JOURNAL_DEPARTMENTS[0].id
    const idWithAdverts = ALL_MOCK_JOURNAL_DEPARTMENTS[1].id
    it('Should return total count equal to 0', async () => {
      const results = await service.getDepartment(idWithNoAdverts)
      expect(results.totalAdverts).toEqual(0)
    })

    it('Should return total count larger than 0', async () => {
      const results = await service.getDepartment(idWithAdverts)
      expect(results.totalAdverts).toBeGreaterThan(0)
    })
  })

  describe('getOverview', () => {
    it('Should return total count larger than 0', async () => {
      const results = await service.getOverview(
        StatisticsOverviewQueryType.General,
      )
      expect(results.totalAdverts).toEqual(0)
    })

    it('Should throw not implemented error', async () => {
      try {
        await service.getOverview(StatisticsOverviewQueryType.Personal)
      } catch (error) {
        if (error instanceof NotImplementedException) {
          expect(error.message).toEqual('Not Implemented')
          expect(error.getStatus()).toEqual(501)
        }
      }
    })
  })
})
