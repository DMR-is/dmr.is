import { LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'
import { CASE_READY } from '@dmr.is/mocks'

import { Test } from '@nestjs/testing'

import { ICaseService } from '../case/case.service.interface'
import { PdfService } from './pdf.service'
import { IPdfService } from './pdf.service.interface'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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

  // describe('Create case pdf', () => {
  // it('should return a Buffer', async () => {
  //   const retries = 10
  //   let tries = 0
  //   let pdf = null
  //   const wait = async (ms: number) => {
  //     await sleep(ms)
  //   }
  //   while (tries < retries) {
  //     try {
  //       console.log('try number', tries)
  //       await wait(1000)
  //       pdf = await service.getCasePdf('e637c050-a462-4183-972a-5re54he34ad')
  //       writeFileSync(path.join(__dirname, '/test.pdf'), pdf)
  //       break
  //     } catch (error) {
  //       console.log('error', error)
  //       tries++
  //     }
  //   }
  //   if (tries === retries) {
  //     throw new Error('Failed to generate PDF')
  //   }
  //   expect(pdf).toBeInstanceOf(Buffer)
  // })
  // })
})
