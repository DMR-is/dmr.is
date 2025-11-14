import { Module } from '@nestjs/common'

import { ApplicationController } from './application.controller'
import { ApplicationProviderModule } from './application.provider.module'

@Module({
  imports: [ApplicationProviderModule],
  controllers: [ApplicationController],
  exports: [],
})
export class ApplictionControllerModule {}
