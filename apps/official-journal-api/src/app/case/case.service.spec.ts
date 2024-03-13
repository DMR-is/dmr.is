import { LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'
import { Test } from '@nestjs/testing'
import { ICaseService } from './case.service.interface'
import { CaseServiceMock } from './case.service.mock'

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
})
