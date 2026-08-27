import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import {
  CompanyImportResultDto,
  ICompanyImportService,
} from '@dmr.is/doe-modules/company-import'
import {
  IImportUploadService,
  ImportKeyDto,
  ImportUploadBoundary,
} from '@dmr.is/doe-modules/import-upload'
import { UserModel } from '@dmr.is/doe-modules/user'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentAdminUser } from '../../core/decorators/current-admin-user.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'

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
