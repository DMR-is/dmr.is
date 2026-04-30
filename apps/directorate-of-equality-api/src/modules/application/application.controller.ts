import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentCompany } from '../../core/decorators/current-company.decorator'
import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { CompanyDto } from '../company/dto/company.dto'
import { EqualityReportSummaryDto } from '../report/dto/equality-report-summary.dto'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { ParsedReportDto } from '../report-excel/dto/parsed-report.dto'
import { IReportExcelService } from '../report-excel/report-excel.service.interface'
import { ApplicationReportDetailDto } from './dto/application-report-detail.dto'
import { SalaryAnalysisRequestDto } from './dto/salary-analysis.request.dto'
import { SalaryAnalysisResponseDto } from './dto/salary-analysis.response.dto'
import { SubmitEqualityReportDto } from './dto/submit-equality-report.dto'
import { SubmitSalaryReportDto } from './dto/submit-salary-report.dto'
import { IApplicationService } from './application.service.interface'

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const ONE_MB = 1024 * 1024
const MAX_UPLOAD_BYTES = ONE_MB * 20

@Controller({
  path: 'application',
  version: '1',
})
@ApiTags('Application')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, CompanyResourceGuard)
export class ApplicationController {
  constructor(
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
    @Inject(IReportExcelService)
    private readonly reportExcelService: IReportExcelService,
  ) {}

  @Get('company')
  @ApiOperation({ operationId: 'getApplicationCompany' })
  @ApiResponse({ status: 200, type: CompanyDto })
  async getCompany(@CurrentCompany() company: CompanyDto): Promise<CompanyDto> {
    return company
  }

  @Get('reports/excel/template')
  @ApiOperation({ operationId: 'getApplicationBlankExcelTemplate' })
  @ApiProduces(XLSX_MIME)
  @ApiResponse({ status: 200, description: 'Blank salary report template' })
  async getTemplate(): Promise<StreamableFile> {
    const buf = await this.reportExcelService.generateBlankTemplate()

    return new StreamableFile(buf, {
      type: XLSX_MIME,
      disposition: 'attachment; filename="salary-report-template.xlsx"',
    })
  }

  @Post('reports/excel/import')
  @ApiOperation({ operationId: 'importApplicationSalaryReportWorkbook' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 200, type: ParsedReportDto })
  @UseInterceptors(FileInterceptor('file'))
  async importWorkbook(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_UPLOAD_BYTES })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ParsedReportDto> {
    return this.reportExcelService.importWorkbook(file.buffer)
  }

  @Post('reports/salary-analysis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'analyzeApplicationSalaryReport' })
  @ApiResponse({ status: 200, type: SalaryAnalysisResponseDto })
  async salaryAnalysis(
    @CurrentCompany() company: CompanyDto,
    @Body() input: SalaryAnalysisRequestDto,
  ): Promise<SalaryAnalysisResponseDto> {
    return this.applicationService.salaryAnalysis(input, company)
  }

  @Get('reports/equality/active')
  @ApiOperation({
    operationId: 'getApplicationActiveEqualityReport',
    description:
      'Returns the resolved company\'s currently-APPROVED equality report (if any). The application portal references the returned `id` as `equalityReportId` when submitting a salary report.',
  })
  @ApiResponse({ status: 200, type: EqualityReportSummaryDto })
  async getActiveEqualityReport(
    @CurrentCompany() company: CompanyDto,
  ): Promise<EqualityReportSummaryDto> {
    return this.applicationService.getActiveEqualityReport(company)
  }

  @Post('reports/salary')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'submitApplicationSalaryReport' })
  @ApiResponse({ status: 201, type: CreateReportResponseDto })
  async submitSalary(
    @CurrentCompany() company: CompanyDto,
    @Body() input: SubmitSalaryReportDto,
  ): Promise<CreateReportResponseDto> {
    return this.applicationService.submitSalary(input, company)
  }

  @Post('reports/equality')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'submitApplicationEqualityReport' })
  @ApiResponse({ status: 201, type: CreateReportResponseDto })
  async submitEquality(
    @CurrentCompany() company: CompanyDto,
    @Body() input: SubmitEqualityReportDto,
  ): Promise<CreateReportResponseDto> {
    return this.applicationService.submitEquality(input, company)
  }

  @Get('reports/:reportId')
  @ApiOperation({
    operationId: 'getApplicationReport',
    description:
      'Returns company-facing report detail with external comments only.',
  })
  @ApiParam({ name: 'reportId', type: String })
  @ApiResponse({ status: 200, type: ApplicationReportDetailDto })
  async getReport(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<ApplicationReportDetailDto> {
    return this.applicationService.getReport(reportId, company)
  }
}
