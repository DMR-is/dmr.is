import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { CompanyController } from './company.controller'
import { CompanyCoreModule } from './company.core.module'

@Module({
  imports: [CompanyCoreModule, AuthorizationCoreModule],
  controllers: [CompanyController],
  providers: [AdminGuard],
})
export class CompanyApiModule {}
