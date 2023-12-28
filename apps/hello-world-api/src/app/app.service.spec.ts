import { Test } from '@nestjs/testing'

import { AppService } from './app.service'
import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { LoggerService } from '@nestjs/common'

describe('AppService', () => {
  let service: AppService
  let logger: LoggerService

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: LOGGER_PROVIDER,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile()

    service = app.get<AppService>(AppService)
    logger = app.get(LOGGER_PROVIDER)
  })

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const result = service.getData()

      expect(result).toEqual({ message: 'Hello API' })
    })

    it('should log "Hello API logger"', () => {
      service.getData()

      expect(logger.log).toHaveBeenCalledWith('Hello API logger')
    })
  })
})
