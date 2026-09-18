import { Module } from '@nestjs/common'

import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { LocationCoreModule } from '@dmr.is/doe-modules/location'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { LocationController } from './location.controller'

@Module({
  imports: [LocationCoreModule, AuthorizationCoreModule],
  controllers: [LocationController],
  providers: [AdminGuard],
})
export class LocationApiModule {}
