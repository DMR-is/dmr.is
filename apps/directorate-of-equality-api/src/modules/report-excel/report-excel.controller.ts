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

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ImportKeyDto } from '../import-upload/dto/import-key.dto'
import {
  IImportUploadService,
  ImportUploadBoundary,
} from '../import-upload/import-upload.service.interface'
import { ParsedReportDto } from './dto/parsed-report.dto'
import { IReportExcelService } from './report-excel.service.interface'

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
    const buffer = await this.importUploadService.fetchWorkbook(
      body.key,
      ImportUploadBoundary.ADMIN,
    )
    try {
      return await this.reportExcelService.importWorkbook(
        buffer,
        ImportUploadBoundary.ADMIN,
      )
    } finally {
      await this.importUploadService.cleanup(body.key)
    }
  }
}
