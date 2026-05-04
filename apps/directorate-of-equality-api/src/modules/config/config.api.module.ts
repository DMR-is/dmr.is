import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { ConfigController } from './config.controller'
import { ConfigCoreModule } from './config.core.module'

@Module({
  imports: [ConfigCoreModule, AuthorizationCoreModule],
  controllers: [ConfigController],
  providers: [AdminGuard],
})
export class ConfigApiModule {}
