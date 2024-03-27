import { LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'
import { ALL_MOCK_CASES } from '@dmr.is/mocks'

import { Test } from '@nestjs/testing'

import { ICaseService } from './case.service.interface'
import { CaseServiceMock } from './case.service.mock'
import { CaseStatus } from '@dmr.is/shared/dto'

describe('CaseService', () => {
  let service: ICaseService

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggingModule],
      providers: [
        {
          provide: ICaseService,
          useClass: CaseServiceMock,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile()

    service = app.get<ICaseService>(ICaseService)
  })

  describe('getCase', () => {
    it('Should return a case', async () => {
      const results = await service.getCase(
        'e6d7c050-a462-4183-972a-5c375e6e348d',
      )
      expect(results?.id).toEqual('e6d7c050-a462-4183-972a-5c375e6e348d')
    })

    it('Should throw not found exception', async () => {
      expect(async () => {
        await service.getCase('not-found')
      }).rejects.toThrow('Case not found')
    })
  })

  describe('getCases', () => {
    it('Should return all cases', async () => {
      const results = await service.getCases()
      expect(results.cases.length).toEqual(ALL_MOCK_CASES.length)
    })

    it('Should return case with caseNumber 1234', async () => {
      const results = await service.getCases({ caseNumber: 1234 })
      expect(results.cases.length).toEqual(1)
    })

    it('Should return no results', async () => {
      const results = await service.getCases({ caseNumber: 9999 })
      expect(results.cases.length).toEqual(0)
    })
  })

  describe('getEditorialOverview', () => {
    it('Should return editorial overview', async () => {
      const results = await service.getEditorialOverview({
        status: CaseStatus.Submitted,
      })
      expect(results.totalItems).toEqual(
        ALL_MOCK_CASES.filter((c) => c.status === CaseStatus.Submitted).length,
      )
    })
  })
})
