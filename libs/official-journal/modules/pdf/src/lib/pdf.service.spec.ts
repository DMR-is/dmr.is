import { LoggingModule } from '@dmr.is/logging'
import { CaseModel } from '@dmr.is/official-journal/models'
import { IApplicationService } from '@dmr.is/shared/modules/application'

import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { PdfService } from './pdf.service'
import { IPdfService } from './pdf.service.interface'

describe('PdfService', () => {
  let service: IPdfService
  let applicationService: IApplicationService
  let caseModel: CaseModel

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggingModule],
      providers: [
        {
          provide: IPdfService,
          useClass: PdfService,
        },
        {
          provide: getModelToken(CaseModel),
          useClass: jest.fn(() => ({})),
        },
        {
          provide: IApplicationService,
          useClass: jest.fn(() => ({
            getApplication: () => ({}),
          })),
        },
      ],
    }).compile()

    applicationService = app.get<IApplicationService>(IApplicationService)
    service = app.get<IPdfService>(IPdfService)
    caseModel = app.get<CaseModel>(getModelToken(CaseModel))
  })

  describe('Should exists', () => {
    it('should be defined', () => {
      expect(service).toBeDefined()
    })
  })
})
