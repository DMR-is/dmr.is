import { Module } from '@nestjs/common'

import {
  AuthorizationCoreModule,
  CompanyCommentCoreModule,
  CompanyCoreModule,
} from '@dmr.is/doe-modules'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { CompanyController } from './company.controller'

@Module({
  imports: [CompanyCoreModule, AuthorizationCoreModule, CompanyCommentCoreModule],
  controllers: [CompanyController],
  providers: [AdminGuard],
})
export class CompanyApiModule {}
