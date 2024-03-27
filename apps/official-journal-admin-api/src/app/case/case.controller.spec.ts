import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_CASES } from '@dmr.is/mocks'

import { Test, TestingModule } from '@nestjs/testing'

import { CaseController } from './case.controller'
import { ICaseService } from './case.service.interface'
import { CaseServiceMock } from './case.service.mock'

describe('CaseController', () => {
  let theCase: TestingModule
  let caseController: CaseController

  beforeAll(async () => {
    theCase = await Test.createTestingModule({
      controllers: [CaseController],
      providers: [
        {
          provide: ICaseService,
          useClass: CaseServiceMock,
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
  describe('/:id', () => {
    it('should return correct case', async () => {
      const result = await caseController.case(
        'e6d7c050-a462-4183-972a-5c375e6e348d',
      )
      expect(result?.id).toEqual('e6d7c050-a462-4183-972a-5c375e6e348d')
    })

    it('should throw not found exception', async () => {
      expect(async () => {
        await caseController.case('not-found')
      }).rejects.toThrow('Case not found')
    })
  })

  describe('/', () => {
    it('should return correct cases', async () => {
      const result = await caseController.cases()
      expect(result.cases.length).toEqual(ALL_MOCK_CASES.length)
    })

    it('should return case with caseNumber 1234', async () => {
      const result = await caseController.cases({ caseNumber: 1234 })
      expect(result.cases.length).toEqual(1)
    })

    it('should return no results', async () => {
      const result = await caseController.cases({ caseNumber: 9999 })
      expect(result.cases.length).toEqual(0)
    })
  })
})
