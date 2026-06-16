import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { CompanyCommentCoreModule } from '../company-comment/company-comment.core.module'
import { CompanyController } from './company.controller'
import { CompanyCoreModule } from './company.core.module'

@Module({
  imports: [CompanyCoreModule, AuthorizationCoreModule, CompanyCommentCoreModule],
  controllers: [CompanyController],
  providers: [AdminGuard],
})
export class CompanyApiModule {}
