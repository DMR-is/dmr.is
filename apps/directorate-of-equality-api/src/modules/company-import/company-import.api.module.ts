import { Module } from '@nestjs/common'

import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { CompanyImportCoreModule } from '@dmr.is/doe-modules/company-import'
import { ImportUploadCoreModule } from '@dmr.is/doe-modules/import-upload'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { CompanyImportController } from './company-import.controller'

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
