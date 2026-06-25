import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { ImportUploadController } from './import-upload.controller'
import { ImportUploadCoreModule } from './import-upload.core.module'

@Module({
  imports: [ImportUploadCoreModule, AuthorizationCoreModule],
  controllers: [ImportUploadController],
  providers: [AdminGuard],
})
export class ImportUploadApiModule {}
