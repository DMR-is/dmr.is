import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Inject,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Query,
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

import { PagingQuery } from '@dmr.is/shared-dto'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AutoProvisionCompany } from '../../core/decorators/auto-provision-company.decorator'
import { CurrentCompany } from '../../core/decorators/current-company.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { CompanyDto } from '../company/dto/company.dto'
import { EqualityReportSummaryDto } from '../report/dto/equality-report-summary.dto'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { GetReportOutliersResponseDto } from '../report-employee/dto/get-report-outliers-response.dto'
import { ParsedReportDto } from '../report-excel/dto/parsed-report.dto'
import { IReportExcelService } from '../report-excel/report-excel.service.interface'
import { ApplicationReportCommentDto } from './dto/application-report-comment.dto'
import { ApplicationReportDetailDto } from './dto/application-report-detail.dto'
import { EditEqualityContentDto } from './dto/edit-equality-content.dto'
import { EditOutliersDto } from './dto/edit-outliers.dto'
import { SalaryAnalysisRequestDto } from './dto/salary-analysis.request.dto'
import { SalaryAnalysisResponseDto } from './dto/salary-analysis.response.dto'
import { SubmitApplicationReportCommentDto } from './dto/submit-application-report-comment.dto'
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
  @AutoProvisionCompany()
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

  @Get('reports/:providerId')
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      "Upstream submission ID (e.g. the island.is application UUID). Identifies the report by the originator's own handle rather than the DoE-side `report.id`, which the applicant does not see. Resolved against reports whose parent company matches the authenticated company.",
  })
  @DoeResponse({
    operationId: 'getApplicationReport',
    include404: true,
    description:
      'Returns company-facing report detail with external comments. Looked up by upstream `providerId`.',
    type: ApplicationReportDetailDto,
  })
  async getReport(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<ApplicationReportDetailDto> {
    return this.applicationService.getReport(providerId, company)
  }

  @Get('reports/:providerId/outliers')
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      'Upstream submission ID (e.g. the island.is application UUID).',
  })
  @DoeResponse({
    operationId: 'getApplicationReportOutliers',
    include404: true,
    description:
      'Paginated list of the report\'s employee outliers. Split out from the report-detail payload because a single salary report can carry hundreds of rows. Ordered by `employeeOrdinal` ascending.',
    type: GetReportOutliersResponseDto,
  })
  async getReportOutliers(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
    @Query() query: PagingQuery,
  ): Promise<GetReportOutliersResponseDto> {
    return this.applicationService.getReportOutliers(providerId, company, query)
  }

  @Post('reports/:providerId/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      'Upstream submission ID (e.g. the island.is application UUID).',
  })
  @DoeResponse({
    operationId: 'submitApplicationReportComment',
    status: 201,
    include404: true,
    description:
      'Submits an external comment on a report owned by the authenticated company. Report is looked up by upstream `providerId`.',
    type: ApplicationReportCommentDto,
  })
  async submitComment(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: SubmitApplicationReportCommentDto,
  ): Promise<ApplicationReportCommentDto> {
    return this.applicationService.createReportComment(
      providerId,
      input,
      company,
    )
  }

  @Put('reports/:providerId/equality-content')
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      'Upstream submission ID (e.g. the island.is application UUID).',
  })
  @DoeResponse({
    operationId: 'editApplicationEqualityContent',
    include404: true,
    description:
      'Replaces the narrative body of an EQUALITY report in place. Allowed only on reports in status `IN_REVIEW`. Emits an `EDITED` event; status is preserved.',
    type: ApplicationReportDetailDto,
  })
  async editEqualityContent(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: EditEqualityContentDto,
  ): Promise<ApplicationReportDetailDto> {
    return this.applicationService.editEqualityContent(
      providerId,
      input,
      company,
    )
  }

  @Put('reports/:providerId/outliers')
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      'Upstream submission ID (e.g. the island.is application UUID).',
  })
  @DoeResponse({
    operationId: 'editApplicationOutliers',
    include404: true,
    description:
      'Replaces outlier explanations on a SALARY report. All-or-none — the submitted set must match the canonical detected outliers exactly. Allowed in status `POSTPONED` (transitions to `SUBMITTED`) or `IN_REVIEW` (status preserved). Always emits `EDITED`; the `POSTPONED → SUBMITTED` case additionally emits `STATUS_CHANGED`.',
    type: ApplicationReportDetailDto,
  })
  async editOutliers(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: EditOutliersDto,
  ): Promise<ApplicationReportDetailDto> {
    return this.applicationService.editOutliers(providerId, input, company)
  }

  @Delete('reports/:providerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      'Upstream submission ID (e.g. the island.is application UUID).',
  })
  @DoeResponse({
    operationId: 'withdrawApplicationReport',
    status: HttpStatus.NO_CONTENT,
    include404: true,
    description:
      'Withdraws the report tied to an island.is application the applicant deleted upstream. Sets status to `WITHDRAWN` and emits `STATUS_CHANGED`. Allowed only before the report reaches a terminal state (`APPROVED`/`DENIED`/`SUPERSEDED`); idempotent on an already-`WITHDRAWN` report.',
  })
  async withdrawReport(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<void> {
    return this.applicationService.withdraw(providerId, company)
  }
}
