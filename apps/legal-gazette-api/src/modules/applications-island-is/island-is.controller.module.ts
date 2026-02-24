import { Module } from '@nestjs/common'

import { NationalRegistryModule } from '@dmr.is/clients-national-registry'

import { CurrentNationalRegistryPersonGuard } from '../../core/guards/current-submitte.guard'
import { ApplicationProviderModule } from '../applications/application.provider.module'
import { IslandIsApplicationController } from './island-is-application.controller'

@Module({
  imports: [ApplicationProviderModule, NationalRegistryModule],
  controllers: [IslandIsApplicationController],
  providers: [CurrentNationalRegistryPersonGuard],
  exports: [],
})
export class IslandIsControllerModule {}
