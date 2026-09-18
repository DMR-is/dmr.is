import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import {
  IImportUploadService,
  ImportKeyDto,
  ImportUploadBoundary,
} from '@dmr.is/doe-modules/import-upload'
import {
  IReportExcelService,
  ParsedReportDto,
} from '@dmr.is/doe-modules/report-excel'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

@Controller({
  path: 'reports/excel',
  version: '1',
})
@ApiTags('Report Excel')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class ReportExcelController {
  constructor(
    @Inject(IReportExcelService)
    private readonly reportExcelService: IReportExcelService,
    @Inject(IImportUploadService)
    private readonly importUploadService: IImportUploadService,
  ) {}

  @Get('template')
  @DoeResponse({
    operationId: 'getBlankExcelTemplate',
    successDescription: 'Blank salary report template',
    produces: XLSX_MIME,
  })
  async getTemplate(): Promise<StreamableFile> {
    const buf = await this.reportExcelService.generateBlankTemplate()
    return new StreamableFile(buf, {
      type: XLSX_MIME,
      disposition: 'attachment; filename="salary-report-template.xlsx"',
    })
  }

  @Post('import')
  @DoeResponse({
    operationId: 'importSalaryReportWorkbook',
    type: ParsedReportDto,
  })
  async importWorkbook(
    @Body() body: ImportKeyDto,
  ): Promise<ParsedReportDto> {
    // Not a `finally`. The download happens inside `importWorkbook` now, so a
    // transient S3 failure reaches this scope — and deleting the staged object
    // there destroys the only copy of an upload the caller can still retry.
    // `cleanupAfter` owns which outcomes are terminal; see `import-upload`.
    try {
      // The key, not a buffer: the service downloads under the parse gate so
      // the workbook is never in memory without a slot.
      const parsed = await this.reportExcelService.importWorkbook(
        body.key,
        ImportUploadBoundary.ADMIN,
      )
      await this.importUploadService.cleanupAfter(
        body.key,
        ImportUploadBoundary.ADMIN,
      )
      return parsed
    } catch (e) {
      await this.importUploadService.cleanupAfter(
        body.key,
        ImportUploadBoundary.ADMIN,
        e,
      )
      throw e
    }
  }
}
