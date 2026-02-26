import { NotImplementedException } from '@nestjs/common'
import { Test } from '@nestjs/testing'

import { LoggingModule } from '@dmr.is/logging'
import { ALL_MOCK_JOURNAL_DEPARTMENTS } from '@dmr.is/mocks'
import {
  DepartmentSlugEnum,
  StatisticsOverviewQueryType,
} from '@dmr.is/shared-dto'

import { IStatisticsService } from './statistics.service.interface'
import { MockStatisticsService } from './statistics.service.mock'
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
    ALL_MOCK_JOURNAL_DEPARTMENTS.forEach((department) => {
      it('Should return total count larger than or equal to 0', async () => {
        const results = (
          await service.getDepartment(department.slug as DepartmentSlugEnum)
        ).unwrap()
        expect(results.total).toBeGreaterThanOrEqual(0)
      })
    })
  })
  describe('getOverview', () => {
    it('Should return total count larger than 0', async () => {
      const results = (
        await service.getOverview(StatisticsOverviewQueryType.General)
      ).unwrap()
      expect(results.total).toEqual(0)
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
