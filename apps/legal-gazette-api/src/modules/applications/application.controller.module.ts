import { Module } from '@nestjs/common'

import { RecallApplicationController } from './recall/recall-application.controller'
import { RecallApplicationProviderModule } from './recall/recall-application.provider.module'
import { ApplicationController } from './application.controller'
import { ApplicationProviderModule } from './application.provider.module'
@Module({
  imports: [RecallApplicationProviderModule, ApplicationProviderModule],
  controllers: [RecallApplicationController, ApplicationController],
  exports: [],
})
export class ApplictionControllerModule {}
