import {
  Body,
  Controller,
  Inject,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common'
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
      await this.importUploadService.cleanup(
        body.key,
        ImportUploadBoundary.ADMIN,
      )
      return result
    } catch (e) {
      // Not a `finally`. A saturated parse gate answers 503 and tells the
      // caller to retry, and the staged object is what they would retry with —
      // deleting it turns a retryable shed into "redo the presign, the PUT and
      // the preview". `import-upload.service.ts` states the same rule for its
      // own error path: only a terminal outcome may destroy the caller's
      // upload, never a transient one.
      //
      // Every other failure here is terminal for this key — an unreadable
      // workbook, a validation reject, a DB error on the transaction — so
      // those still clean up.
      //
      // Matching the whole exception class is deliberate, not lazy: it is
      // broader than the shed path, so any other 503 raised here also keeps
      // the object. That is the safe direction. Keeping an object nobody
      // retries costs a stale file, which the bucket lifecycle rule reaps
      // anyway (see `cleanup`); deleting one somebody is about to retry costs
      // them the whole upload flow. Do not narrow this to a bespoke error
      // type — that trades a cheap failure for an expensive one.
      //
      // The fetch now happens inside `apply`, so this block is also reachable
      // with a key that failed validation. `cleanup` re-checks it against the
      // boundary for that reason — do not assume the key here is trusted.
      if (!(e instanceof ServiceUnavailableException)) {
        await this.importUploadService.cleanup(
          body.key,
          ImportUploadBoundary.ADMIN,
        )
      }
      throw e
    }
  }
}
