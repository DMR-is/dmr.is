import { Test } from '@nestjs/testing'

import { IUtilityService } from '../utility/utility.service.interface'
import { PdfService } from './pdf.service'
import { IPdfService } from './pdf.service.interface'

describe('PdfService', () => {
  let service: IPdfService

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IPdfService,
          useClass: PdfService,
        },
        {
          provide: IUtilityService,
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
