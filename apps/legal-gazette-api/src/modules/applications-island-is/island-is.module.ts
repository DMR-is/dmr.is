import { Module } from '@nestjs/common'

import { ApplicationModule } from '../../services/application/application.module'
import { IslandIsApplicationController } from './island-is-application.controller'

@Module({
  imports: [ApplicationModule],
  controllers: [IslandIsApplicationController],
  providers: [],
  exports: [],
})
export class IslandIsControllerModule {}
