import { Module } from '@nestjs/common'

import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { CompanyCoreModule } from '@dmr.is/doe-modules/company'
import { CompanyCommentCoreModule } from '@dmr.is/doe-modules/company-comment'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { CompanyController } from './company.controller'

@Module({
  imports: [CompanyCoreModule, AuthorizationCoreModule, CompanyCommentCoreModule],
  controllers: [CompanyController],
  providers: [AdminGuard],
})
export class CompanyApiModule {}
