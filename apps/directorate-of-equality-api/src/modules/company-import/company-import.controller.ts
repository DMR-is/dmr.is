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
    // The key, not a buffer: the service downloads under the parse gate so the
    // workbook is never in memory without a slot. See `archive-budget.ts`.
    return this.companyImportService.preview(body.key)
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
    try {
      const result = await this.companyImportService.apply(body.key, admin.id)
      await this.importUploadService.cleanupAfter(
        body.key,
        ImportUploadBoundary.ADMIN,
      )
      return result
    } catch (e) {
      // Not a `finally`, and no longer a local rule. This used to exempt
      // `ServiceUnavailableException` only, which reads as "keep it when the
      // failure was transient" and is not the same thing: a transient S3 error
      // arrives from `ResultWrapper.unwrap` as a plain `HttpException`, so it
      // fell straight through to the delete. The download moving inside
      // `apply` made that reachable rather than theoretical.
      //
      // `cleanupAfter` now owns the decision, as an allow-list of terminal
      // outcomes, so a status nobody has thought of yet keeps the upload
      // instead of destroying it. The reasoning lives with the rule in
      // `import-upload.service.ts`.
      //
      // This block is also reachable with a key that failed validation, which
      // is why the delete path re-checks the key against the boundary — do not
      // assume the key here is trusted, and do not collapse the two guards.
      await this.importUploadService.cleanupAfter(
        body.key,
        ImportUploadBoundary.ADMIN,
        e,
      )
      throw e
    }
  }
}
