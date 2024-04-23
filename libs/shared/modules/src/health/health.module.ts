import { Module } from '@nestjs/common'

import { HealthController } from './health.controller'
export { HealthController }

Module({
  controllers: [HealthController],
})
export class HealthModule {}
