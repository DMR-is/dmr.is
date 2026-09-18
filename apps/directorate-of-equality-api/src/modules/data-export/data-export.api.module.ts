import { Module } from '@nestjs/common'

import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { DataExportCoreModule } from '@dmr.is/doe-modules/data-export'

import { DataExportController } from './data-export.controller'

@Module({
  imports: [DataExportCoreModule, AuthorizationCoreModule],
  controllers: [DataExportController],
})
export class DataExportApiModule {}
