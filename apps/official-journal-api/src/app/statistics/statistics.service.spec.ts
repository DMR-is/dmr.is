import { Test } from '@nestjs/testing'
import { IStatisticsService } from './statistics.service.interface'
import { LoggingModule } from '@dmr.is/logging'
import { MockStatisticsService } from './statistics.service.mock'
import { ALL_MOCK_JOURNAL_DEPARTMENTS } from '../../mock/journal.mock'

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
      const results = await service.getDepartment({ id: idWithNoAdverts })
      expect(results.totalAdverts).toEqual(0)
    })

    it('Should return total count larger than 0', async () => {
      const results = await service.getDepartment({ id: idWithAdverts })
      expect(results.totalAdverts).toBeGreaterThan(0)
    })
  })
})
