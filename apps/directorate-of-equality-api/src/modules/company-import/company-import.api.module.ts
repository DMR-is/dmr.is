import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { CompanyImportController } from './company-import.controller'
import { CompanyImportCoreModule } from './company-import.core.module'

@Module({
  imports: [CompanyImportCoreModule, AuthorizationCoreModule],
  controllers: [CompanyImportController],
  providers: [AdminGuard],
})
export class CompanyImportApiModule {}
