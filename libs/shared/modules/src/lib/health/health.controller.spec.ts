import { Test, TestingModule } from '@nestjs/testing'

import { HealthController } from './health.controller'
describe('HealthController', () => {
  let health: TestingModule
  let healthController: HealthController
  beforeAll(async () => {
    health = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [],
    }).compile()
    healthController = health.get<HealthController>(HealthController)
  })
  describe('health', () => {
    it('should return health check', async () => {
      const result = await healthController.health()
      expect(result).toEqual('OK')
    })
  })
})
