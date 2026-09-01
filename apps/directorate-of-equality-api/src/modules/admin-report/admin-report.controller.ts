import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'

import {
  AdminEqualityReportDto,
  AdminSalaryReportDto,
  IAdminReportService,
} from '@dmr.is/doe-modules/admin-report'
import {
  IImportUploadService,
  ImportKeyDto,
  ImportUploadBoundary,
} from '@dmr.is/doe-modules/import-upload'
import { CreateReportResponseDto } from '@dmr.is/doe-modules/report-create'
import {
  IReportExcelService,
  ParsedReportDto,
} from '@dmr.is/doe-modules/report-excel'
import {
  SalaryAnalysisRequestDto,
  SalaryAnalysisResponseDto,
} from '@dmr.is/doe-modules/report-statistics'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

@Controller({
  path: 'admin-report',
  version: '1',
})
@ApiTags('Admin Report')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class AdminReportController {
  constructor(
    @Inject(IAdminReportService)
    private readonly adminReportService: IAdminReportService,
    @Inject(IReportExcelService)
    private readonly reportExcelService: IReportExcelService,
    @Inject(IImportUploadService)
    private readonly importUploadService: IImportUploadService,
  ) {}

  @Get('reports/excel/template')
  @DoeResponse({
    operationId: 'getAdminBlankExcelTemplate',
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

  @Post('companies/:companyId/reports/excel/import')
  @ApiParam({ name: 'companyId', type: String })
  @DoeResponse({
    operationId: 'importAdminSalaryReportWorkbook',
    type: ParsedReportDto,
  })
  async importWorkbook(
    @Param('companyId', ParseUUIDPipe) _companyId: string,
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

  @Post('companies/:companyId/reports/salary/analyze')
  @ApiParam({ name: 'companyId', type: String })
  @DoeResponse({
    operationId: 'analyzeAdminSalaryReport',
    type: SalaryAnalysisResponseDto,
  })
  async analyzeSalary(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() input: SalaryAnalysisRequestDto,
  ): Promise<SalaryAnalysisResponseDto> {
    return this.adminReportService.analyzeSalary(companyId, input)
  }

  @Post('companies/:companyId/reports/salary')
  @ApiParam({ name: 'companyId', type: String })
  @DoeResponse({
    operationId: 'submitAdminSalaryReport',
    status: 201,
    type: CreateReportResponseDto,
  })
  async submitSalary(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() input: AdminSalaryReportDto,
  ): Promise<CreateReportResponseDto> {
    return this.adminReportService.submitSalary(companyId, input)
  }

  @Post('companies/:companyId/reports/equality')
  @ApiParam({ name: 'companyId', type: String })
  @DoeResponse({
    operationId: 'submitAdminEqualityReport',
    status: 201,
    type: CreateReportResponseDto,
  })
  async submitEquality(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() input: AdminEqualityReportDto,
  ): Promise<CreateReportResponseDto> {
    return this.adminReportService.submitEquality(companyId, input)
  }
}
