import { Module } from '@nestjs/common'

import {
  AuthorizationCoreModule,
  LocationCoreModule,
} from '@dmr.is/doe-modules'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { LocationController } from './location.controller'

@Module({
  imports: [LocationCoreModule, AuthorizationCoreModule],
  controllers: [LocationController],
  providers: [AdminGuard],
})
export class LocationApiModule {}
