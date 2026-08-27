import { Module } from '@nestjs/common'

import {
  AuthorizationCoreModule,
  ImportUploadCoreModule,
} from '@dmr.is/doe-modules'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ImportUploadController } from './import-upload.controller'
import { ImportUploadLocalController } from './import-upload-local.controller'

/**
 * The local upload controller is an unauthenticated 25MB raw-body PUT. It stands
 * in for an S3 presigned URL when no bucket is configured, so outside local
 * development it has no reason to exist — and an unauthenticated write route
 * that merely refuses at the service layer is one env var away from being a
 * real one. Registering it conditionally means production returns 404 because
 * the route is absent, not because something declined to use it.
 */
const isLocalUploadEnabled = !process.env.AWS_SALARY_ANALYSIS_FILES_BUCKET

@Module({
  imports: [ImportUploadCoreModule, AuthorizationCoreModule],
  controllers: [
    ImportUploadController,
    ...(isLocalUploadEnabled ? [ImportUploadLocalController] : []),
  ],
  providers: [AdminGuard],
})
export class ImportUploadApiModule {}
