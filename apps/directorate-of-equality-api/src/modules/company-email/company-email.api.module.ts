import { Module } from '@nestjs/common'

import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { CompanyEmailCoreModule } from '@dmr.is/doe-modules/company-email'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { CompanyEmailController } from './company-email.controller'

@Module({
  imports: [CompanyEmailCoreModule, AuthorizationCoreModule],
  controllers: [CompanyEmailController],
  providers: [AdminGuard],
})
export class CompanyEmailApiModule {}
