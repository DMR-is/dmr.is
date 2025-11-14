import { Module } from '@nestjs/common'

import { ApplicationModule } from '../../services/application/application.module'
import { ApplicationController } from './application.controller'

@Module({
  imports: [ApplicationModule],
  controllers: [ApplicationController],
  exports: [],
})
export class ApplictionControllerModule {}
