import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentAdminUser } from '../../core/decorators/current-admin-user.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ImportKeyDto } from '../import-upload/dto/import-key.dto'
import {
  IImportUploadService,
  ImportUploadBoundary,
} from '../import-upload/import-upload.service.interface'
import { UserModel } from '../user/models/user.model'
import { CompanyImportResultDto } from './dto/company-import-result.dto'
import { ICompanyImportService } from './company-import.service.interface'

@Controller({
  path: 'companies/import',
  version: '1',
})
@ApiTags('Company Import')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class CompanyImportController {
  constructor(
    @Inject(ICompanyImportService)
    private readonly companyImportService: ICompanyImportService,
    @Inject(IImportUploadService)
    private readonly importUploadService: IImportUploadService,
  ) {}

  // The same uploaded object is previewed and then applied, so preview leaves
  // it in place; only apply removes it once the write is committed.
  @Post('preview')
  @DoeResponse({
    operationId: 'previewCompanyImport',
    type: CompanyImportResultDto,
  })
  async preview(@Body() body: ImportKeyDto): Promise<CompanyImportResultDto> {
    const buffer = await this.importUploadService.fetchWorkbook(
      body.key,
      ImportUploadBoundary.ADMIN,
    )
    return this.companyImportService.preview(buffer)
  }

  @Post('apply')
  @DoeResponse({
    operationId: 'applyCompanyImport',
    type: CompanyImportResultDto,
  })
  async apply(
    @Body() body: ImportKeyDto,
    @CurrentAdminUser() admin: UserModel,
  ): Promise<CompanyImportResultDto> {
    const buffer = await this.importUploadService.fetchWorkbook(
      body.key,
      ImportUploadBoundary.ADMIN,
    )
    try {
      return await this.companyImportService.apply(buffer, admin.id)
    } finally {
      await this.importUploadService.cleanup(body.key)
    }
  }
}
