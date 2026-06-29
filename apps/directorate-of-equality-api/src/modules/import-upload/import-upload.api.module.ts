import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { ImportUploadController } from './import-upload.controller'
import { ImportUploadCoreModule } from './import-upload.core.module'
import { ImportUploadLocalController } from './import-upload-local.controller'

@Module({
  imports: [ImportUploadCoreModule, AuthorizationCoreModule],
  controllers: [ImportUploadController, ImportUploadLocalController],
  providers: [AdminGuard],
})
export class ImportUploadApiModule {}
