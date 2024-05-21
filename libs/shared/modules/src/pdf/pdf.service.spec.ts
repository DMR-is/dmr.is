import { LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'
import { CASE_READY } from '@dmr.is/mocks'

import { Test } from '@nestjs/testing'

import { ICaseService } from '../case/case.service.interface'
import { PdfService } from './pdf.service'
import { IPdfService } from './pdf.service.interface'

describe('PdfService', () => {
  let service: IPdfService

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggingModule],
      providers: [
        {
          provide: IPdfService,
          useClass: PdfService,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: ICaseService,
          useValue: {
            getCase: jest.fn(() => ({
              ...CASE_READY,
            })),
            initialize: jest.fn(() => {}),
          },
        },
      ],
    }).compile()

    service = app.get<IPdfService>(IPdfService)
  })

  describe('Should exists', () => {
    it('should be defined', () => {
      expect(service).toBeDefined()
    })
  })
})
