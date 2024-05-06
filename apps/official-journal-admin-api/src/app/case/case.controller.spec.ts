import { LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'
import { ALL_MOCK_CASES } from '@dmr.is/mocks'
import { ICaseService, IJournalService } from '@dmr.is/modules'
import { CaseStatus } from '@dmr.is/shared/dto'

import { Test, TestingModule } from '@nestjs/testing'

import { CaseController } from './case.controller'

describe('CaseController', () => {
  let theCase: TestingModule
  let caseController: CaseController

  beforeAll(async () => {
    theCase = await Test.createTestingModule({
      controllers: [CaseController],
      imports: [LoggingModule],
      providers: [
        {
          provide: ICaseService,
          useValue: {
            getCases: jest
              .fn()
              .mockImplementation(() => ({ cases: ALL_MOCK_CASES })),
            getCase: jest
              .fn()
              .mockImplementation((id) =>
                ALL_MOCK_CASES.find((c) => c.id === id),
              ),
            getEditorialOverview: jest.fn().mockImplementation(),
          },
        },
        {
          provide: IJournalService,
          useValue: {
            getJournal: jest.fn().mockImplementation(),
          },
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile()
    caseController = theCase.get<CaseController>(CaseController)
  })
  describe('case', () => {
    it('should return correct case', async () => {
      const result = await caseController.case(
        'e6d7c050-a462-4183-972a-5c375e6e348d',
      )
      expect(result?.id).toEqual('e6d7c050-a462-4183-972a-5c375e6e348d')
    })
  })

  describe('cases', () => {
    it('should return correct cases', async () => {
      const result = await caseController.cases()
      expect(result.cases.length).toEqual(ALL_MOCK_CASES.length)
    })

    it('should return case with caseNumber 5824', async () => {
      const result = await caseController.cases({ caseNumber: 12582434 })
      expect(result.cases.length).toBeGreaterThanOrEqual(1)
    })

    // it('should return no results', async () => {
    //   const result = await caseController.cases()

    //   expect(result.cases.length).toEqual(0)
    // })
  })

  // describe('getEditorialOverview', () => {
  //   it('Should return editorial overview', async () => {
  //     const results = await caseController.editorialOverview({
  //       status: CaseStatus.Submitted,
  //     })
  //     expect(results.data.length).toEqual(
  //       ALL_MOCK_CASES.filter((c) => c.status === CaseStatus.Submitted).length,
  //     )
  //   })
  // })
})
