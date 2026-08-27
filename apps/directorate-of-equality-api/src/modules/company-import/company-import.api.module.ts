import { Module } from '@nestjs/common'

import {
  AuthorizationCoreModule,
  CompanyImportCoreModule,
  ImportUploadCoreModule,
} from '@dmr.is/doe-modules'

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
