import { NotImplementedException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_JOURNAL_DEPARTMENTS } from '@dmr.is/mocks'
import { IUserService } from '@dmr.is/modules'
import {
  DepartmentSlugEnum,
  StatisticsOverviewQueryType,
  UserDto,
} from '@dmr.is/shared/dto'

import { StatisticsController } from './statistics.controller'
import { IStatisticsService } from './statistics.service.interface'
import { MockStatisticsService } from './statistics.service.mock'

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
          provide: IUserService,
          useValue: jest.fn(),
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
    ALL_MOCK_JOURNAL_DEPARTMENTS.forEach((department) => {
      it('Should return total count larger than or equal to 0', async () => {
        const results = await controller.department(
          department.slug as DepartmentSlugEnum,
        )

        expect(results.total).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('overview', () => {
    it('Should return total count larger than 0', async () => {
      const results = await controller.overview(
        StatisticsOverviewQueryType.General,
        {} as UserDto,
      )
      expect(results.total).toEqual(0)
    })

    it('Should throw not implemented error', async () => {
      try {
        await controller.overview(
          StatisticsOverviewQueryType.General,
          {} as UserDto,
        )
      } catch (error) {
        if (error instanceof NotImplementedException) {
          expect(error.message).toEqual('Not Implemented')
          expect(error.getStatus()).toEqual(501)
        }
      }
    })
  })
})
