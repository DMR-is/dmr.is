import { Module } from '@nestjs/common'

import { ApplicationProviderModule } from './application.provider.module'
import { ApplicationController } from './application.controller'

@Module({
  imports: [ApplicationProviderModule],
  controllers: [ApplicationController],
  exports: [],
})
export class ApplictionControllerModule {}
