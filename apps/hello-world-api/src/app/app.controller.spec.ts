import { Test, TestingModule } from '@nestjs/testing'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { LOGGER_PROVIDER } from '@dmr.is/logging'

describe('AppController', () => {
  let app: TestingModule
  let appController: AppController

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useClass: AppService,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const result = appController.getData()

      expect(result).toEqual(1)
    })
  })
})
