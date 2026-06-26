import { Controller, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { PresignUploadResponseDto } from './dto/presign-upload-response.dto'
import {
  IImportUploadService,
  ImportUploadBoundary,
} from './import-upload.service.interface'

/**
 * Issues presigned upload targets for admin Excel imports. The logic lives in
 * the shared {@link ImportUploadService}; this controller only binds it to the
 * admin guard boundary. An application-facing equivalent (CompanyResourceGuard)
 * can be added later reusing the same service.
 */
@Controller({
  path: 'imports',
  version: '1',
})
@ApiTags('Import Upload')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class ImportUploadController {
  constructor(
    @Inject(IImportUploadService)
    private readonly importUploadService: IImportUploadService,
  ) {}

  @Post('presign')
  @DoeResponse({
    operationId: 'presignAdminImportUpload',
    type: PresignUploadResponseDto,
  })
  async presign(): Promise<PresignUploadResponseDto> {
    return this.importUploadService.createUpload(ImportUploadBoundary.ADMIN)
  }
}
