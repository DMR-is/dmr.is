import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'
import { IAWSService } from '@dmr.is/shared/modules'

import { IUtilityService } from '../utility/utility.service.interface'
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
          provide: IUtilityService,
          useValue: () => ({}),
        },
        {
          provide: IAWSService,
          useValue: () => ({}),
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
