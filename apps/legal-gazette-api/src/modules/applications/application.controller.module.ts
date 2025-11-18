import { Module } from '@nestjs/common'

import { NationalRegistryModule } from '@dmr.is/clients/national-registry'

import { CurrentNationalRegistryPersonGuard } from '../../core/guards/current-submitte.guard'
import { ApplicationController } from './application.controller'
import { ApplicationProviderModule } from './application.provider.module'
@Module({
  imports: [ApplicationProviderModule, NationalRegistryModule],
  controllers: [ApplicationController],
  providers: [CurrentNationalRegistryPersonGuard],
  exports: [],
})
export class ApplictionControllerModule {}
