import {
  Body,
  Controller,
  Get,
  Header,
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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentCompany } from '../../core/decorators/current-company.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
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
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

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
  @DoeResponse({ operationId: 'getApplicationCompany', type: CompanyDto })
  async getCompany(@CurrentCompany() company: CompanyDto): Promise<CompanyDto> {
    return company
  }

  @Get('reports/excel/template')
  @DoeResponse({
    operationId: 'getApplicationBlankExcelTemplate',
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

  @Post('reports/excel/import')
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
  @DoeResponse({
    operationId: 'importApplicationSalaryReportWorkbook',
    type: ParsedReportDto,
  })
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
  @DoeResponse({
    operationId: 'analyzeApplicationSalaryReport',
    type: SalaryAnalysisResponseDto,
    include404: true,
  })
  async salaryAnalysis(
    @CurrentCompany() company: CompanyDto,
    @Body() input: SalaryAnalysisRequestDto,
  ): Promise<SalaryAnalysisResponseDto> {
    return this.applicationService.salaryAnalysis(input, company)
  }

  @Get('reports/equality/active')
  @DoeResponse({
    operationId: 'getApplicationActiveEqualityReport',
    include404: true,
    description:
      "Returns the resolved company's currently-APPROVED equality report (if any). The application portal references the returned `id` as `equalityReportId` when submitting a salary report.",
    type: EqualityReportSummaryDto,
  })
  async getActiveEqualityReport(
    @CurrentCompany() company: CompanyDto,
  ): Promise<EqualityReportSummaryDto> {
    return this.applicationService.getActiveEqualityReport(company)
  }

  @Post('reports/salary')
  @HttpCode(HttpStatus.CREATED)
  @DoeResponse({
    operationId: 'submitApplicationSalaryReport',
    status: 201,
    include404: true,
    type: CreateReportResponseDto,
  })
  async submitSalary(
    @CurrentCompany() company: CompanyDto,
    @Body() input: SubmitSalaryReportDto,
  ): Promise<CreateReportResponseDto> {
    return this.applicationService.submitSalary(input, company)
  }

  @Get('reports/equality/template')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @DoeResponse({
    operationId: 'getApplicationEqualityReportTemplateHtml',
    successDescription: 'HTML version of the equality report template',
    produces: 'text/html',
  })
  getEqualityTemplateHtml(): string {
    return this.applicationService.getEqualityTemplateHtml()
  }

  @Get('reports/equality/template/docx')
  @DoeResponse({
    operationId: 'getApplicationEqualityReportTemplateDocx',
    successDescription: 'Word (.docx) version of the equality report template',
    produces: DOCX_MIME,
  })
  getEqualityTemplateDocx(): StreamableFile {
    const buf = this.applicationService.getEqualityTemplateDocx()

    return new StreamableFile(buf, {
      type: DOCX_MIME,
      disposition: 'attachment; filename="equality-report-template.docx"',
    })
  }

  @Post('reports/equality')
  @HttpCode(HttpStatus.CREATED)
  @DoeResponse({
    operationId: 'submitApplicationEqualityReport',
    status: 201,
    type: CreateReportResponseDto,
  })
  async submitEquality(
    @CurrentCompany() company: CompanyDto,
    @Body() input: SubmitEqualityReportDto,
  ): Promise<CreateReportResponseDto> {
    return this.applicationService.submitEquality(input, company)
  }

  @Get('reports/:reportId')
  @ApiParam({ name: 'reportId', type: String })
  @DoeResponse({
    operationId: 'getApplicationReport',
    include404: true,
    description:
      'Returns company-facing report detail with external comments only.',
    type: ApplicationReportDetailDto,
  })
  async getReport(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<ApplicationReportDetailDto> {
    return this.applicationService.getReport(reportId, company)
  }
}
