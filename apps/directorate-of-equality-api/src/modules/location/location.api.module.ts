import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { LocationController } from './location.controller'
import { LocationCoreModule } from './location.core.module'

@Module({
  imports: [LocationCoreModule, AuthorizationCoreModule],
  controllers: [LocationController],
  providers: [AdminGuard],
})
export class LocationApiModule {}
