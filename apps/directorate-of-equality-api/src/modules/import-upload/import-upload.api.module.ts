import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { ImportUploadController } from './import-upload.controller'
import { ImportUploadCoreModule } from './import-upload.core.module'
import { ImportUploadLocalController } from './import-upload-local.controller'

/**
 * The local upload controller is an unauthenticated 25MB raw-body PUT. It stands
 * in for an S3 presigned URL in local development, so outside that it has no
 * reason to exist — and an unauthenticated write route that merely refuses at
 * the service layer is one env var away from being a real one. Registering it
 * conditionally means production returns 404 because the route is absent, not
 * because something declined to use it.
 *
 * Gated on NODE_ENV rather than the presence of AWS_SALARY_ANALYSIS_FILES_BUCKET
 * — varlock now populates that bucket var in every environment, including local
 * dev, so it no longer distinguishes local from deployed. Must mirror
 * ImportUploadService's isLocal check.
 */
const isLocalUploadEnabled = process.env.NODE_ENV !== 'production'

@Module({
  imports: [ImportUploadCoreModule, AuthorizationCoreModule],
  controllers: [
    ImportUploadController,
    ...(isLocalUploadEnabled ? [ImportUploadLocalController] : []),
  ],
  providers: [AdminGuard],
})
export class ImportUploadApiModule {}
