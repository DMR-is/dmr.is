import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { ImportUploadCoreModule } from '../import-upload/import-upload.core.module'
import { CompanyImportController } from './company-import.controller'
import { CompanyImportCoreModule } from './company-import.core.module'

@Module({
  imports: [
    CompanyImportCoreModule,
    AuthorizationCoreModule,
    ImportUploadCoreModule,
  ],
  controllers: [CompanyImportController],
  providers: [AdminGuard],
})
export class CompanyImportApiModule {}
