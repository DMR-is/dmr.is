import { Module } from '@nestjs/common'

import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { NoticeIssuesCoreModule } from '@dmr.is/doe-modules/notice-issues'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { RequireAdminRoleGuard } from '../../core/guards/admin-role/require-admin-role.guard'
import { NoticeIssuesController } from './notice-issues.controller'

@Module({
  imports: [NoticeIssuesCoreModule, AuthorizationCoreModule],
  controllers: [NoticeIssuesController],
  providers: [AdminGuard, RequireAdminRoleGuard],
})
export class NoticeIssuesApiModule {}
