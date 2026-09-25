import { Module } from '@nestjs/common'

import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { DataExportCoreModule } from '@dmr.is/doe-modules/data-export'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { DataExportController } from './data-export.controller'

@Module({
  imports: [DataExportCoreModule, AuthorizationCoreModule],
  controllers: [DataExportController],
  providers: [AdminGuard],
})
export class DataExportApiModule {}
