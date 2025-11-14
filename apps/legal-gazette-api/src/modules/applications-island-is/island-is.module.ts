import { Module } from '@nestjs/common'

import { ApplicationProviderModule } from '../applications/application.provider.module'
import { IslandIsApplicationController } from './island-is-application.controller'

@Module({
  imports: [ApplicationProviderModule],
  controllers: [IslandIsApplicationController],
  providers: [],
  exports: [],
})
export class IslandIsControllerModule {}
