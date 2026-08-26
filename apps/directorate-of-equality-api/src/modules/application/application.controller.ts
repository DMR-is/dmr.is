import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import {
  ApiKeyDto,
  ApiKeyOriginEnum,
  IssuedApiKeyDto,
} from '@dmr.is/doe-shared'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { PagingQuery } from '@dmr.is/shared-dto'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AutoProvisionCompany } from '../../core/decorators/auto-provision-company.decorator'
import { CurrentCompany } from '../../core/decorators/current-company.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { IApiKeyService } from '../api-key/api-key.service.interface'
import { CreateApiKeyDto } from '../api-key/dto/create-api-key.dto'
import { GetApiKeysResponseDto } from '../api-key/dto/get-api-keys-response.dto'
import { resolveActorNationalId } from '../api-key/lib/resolve-actor'
import { CompanyDto } from '../company/dto/company.dto'
import { ImportKeyDto } from '../import-upload/dto/import-key.dto'
import { PresignUploadResponseDto } from '../import-upload/dto/presign-upload-response.dto'
import {
  IImportUploadService,
  ImportUploadBoundary,
} from '../import-upload/import-upload.service.interface'
import { EqualityReportSummaryDto } from '../report/dto/equality-report-summary.dto'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { GetReportOutliersResponseDto } from '../report-employee/dto/get-report-outliers-response.dto'
import { ParsedReportDto } from '../report-excel/dto/parsed-report.dto'
import { IReportExcelService } from '../report-excel/report-excel.service.interface'
import { SalaryAnalysisRequestDto } from '../report-statistics/dto/salary-analysis.request.dto'
import { SalaryAnalysisResponseDto } from '../report-statistics/dto/salary-analysis.response.dto'
import { ApplicationReportCommentDto } from './dto/application-report-comment.dto'
import { ApplicationReportDetailDto } from './dto/application-report-detail.dto'
import { EditEqualityContentDto } from './dto/edit-equality-content.dto'
import { EditOutliersDto } from './dto/edit-outliers.dto'
import { SalaryReportEligibilityDto } from './dto/salary-report-eligibility.dto'
import { GetSubCriterionCatalogResponseDto } from './dto/sub-criterion-catalog.dto'
import { SubmitApplicationReportCommentDto } from './dto/submit-application-report-comment.dto'
import { SubmitEqualityReportDto } from './dto/submit-equality-report.dto'
import { SubmitSalaryReportDto } from './dto/submit-salary-report.dto'
import { IApplicationService } from './application.service.interface'

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

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
    @Inject(IImportUploadService)
    private readonly importUploadService: IImportUploadService,
    @Inject(IApiKeyService)
    private readonly apiKeyService: IApiKeyService,
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

  @Get('sub-criteria/catalog')
  @DoeResponse({
    operationId: 'getApplicationSubCriterionCatalog',
    description:
      "Jafnréttisstofa's catalog of standard sub-criteria (undirviðmið) — the same list the Excel template offers in its Undirviðmið dropdown, so the portal can present identical choices. Each entry carries its parent criterion, definition, step count and step wording, all of which the employer may overwrite; sub-criteria may also be registered as free text, so this is a starting point, not a closed set. Entries with a null `numSteps` ship with step 1 only and expect the employer to author the rest — `generalScale` gives the suggested generic wording for those. Static reference data: identical for every company and changes only when Jafnréttisstofa ships a new template. Company-scoped only because the controller is, hence the 404 when the authenticated kennitala has no company row yet.",
    type: GetSubCriterionCatalogResponseDto,
    include404: true,
  })
  getSubCriterionCatalog(): GetSubCriterionCatalogResponseDto {
    return this.applicationService.getSubCriterionCatalog()
  }

  @Post('reports/excel/presign')
  @DoeResponse({
    operationId: 'presignApplicationImportUpload',
    type: PresignUploadResponseDto,
  })
  async presignImport(): Promise<PresignUploadResponseDto> {
    return this.importUploadService.createUpload(
      ImportUploadBoundary.APPLICATION,
    )
  }

  @Post('reports/excel/import')
  @DoeResponse({
    operationId: 'importApplicationSalaryReportWorkbook',
    type: ParsedReportDto,
  })
  async importWorkbook(
    @Body() body: ImportKeyDto,
  ): Promise<ParsedReportDto> {
    const buffer = await this.importUploadService.fetchWorkbook(
      body.key,
      ImportUploadBoundary.APPLICATION,
    )
    try {
      return await this.reportExcelService.importWorkbook(
        buffer,
        ImportUploadBoundary.APPLICATION,
      )
    } finally {
      await this.importUploadService.cleanup(body.key)
    }
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
      "Returns the resolved company's currently-APPROVED equality report (if any). The application portal references the returned `id` as `equalityReportId` when submitting a salary report, and passes the returned `providerId` to `GET /application/reports/:providerId` to read the report itself. Neither `id` nor `identifier` is a lookup handle here: `id` only resolves against the admin-only `GET /reports/:id`, and `identifier` is a human-facing display code.",
    type: EqualityReportSummaryDto,
  })
  async getActiveEqualityReport(
    @CurrentCompany() company: CompanyDto,
  ): Promise<EqualityReportSummaryDto> {
    return this.applicationService.getActiveEqualityReport(company)
  }

  @Get('reports/salary/eligibility')
  @DoeResponse({
    operationId: 'getApplicationSalaryReportEligibility',
    description:
      "Pre-flight check of whether the resolved company may submit a salary report right now, with a machine-readable `reason` when blocked so the application portal can gate entry into the flow. Two preconditions are checked: (1) the company must have an APPROVED, in-force equality report (`MISSING_EQUALITY_REPORT`, checked first — a salary report must reference one); and (2) the 3-year renewal window must be open, i.e. the current report is due in 6 months or less (`RENEWAL_WINDOW_NOT_OPEN`). The renewal rule is also enforced as a 409 on `POST reports/salary`, and the equality precondition as a 404.",
    type: SalaryReportEligibilityDto,
  })
  async getSalaryReportEligibility(
    @CurrentCompany() company: CompanyDto,
  ): Promise<SalaryReportEligibilityDto> {
    return this.applicationService.getSalaryReportEligibility(company)
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
      "Paginated list of the report's employee outliers. Split out from the report-detail payload because a single salary report can carry hundreds of rows. Ordered by role title and then by the employee's ordinal within the report — the same grouped-by-role order the draft employee lists serve.",
    type: GetReportOutliersResponseDto,
  })
  async getReportOutliers(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
    @Query() query: PagingQuery,
  ): Promise<GetReportOutliersResponseDto> {
    return this.applicationService.getReportOutliers(providerId, company, query)
  }

  @Get('reports/:providerId/comments')
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      'Upstream submission ID (e.g. the island.is application UUID).',
  })
  @DoeResponse({
    operationId: 'getApplicationReportComments',
    include404: true,
    description:
      "The report's external comment thread on its own, ordered oldest-first. Only comments with `EXTERNAL` visibility are returned — reviewer-internal notes are never exposed to the applicant. Use this instead of re-fetching the report detail when only the conversation is needed; the same list is embedded as `externalComments` in `GET /application/reports/:providerId`.",
    type: [ApplicationReportCommentDto],
  })
  async getReportComments(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<ApplicationReportCommentDto[]> {
    return this.applicationService.getReportComments(providerId, company)
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

  // ---------------------------------------------------------------------------
  // API keys for the third-party integration.
  //
  // Self-service issuance: a company mints its own credential from an optional
  // screen in the island.is application, then pastes it into whichever payroll
  // system submits on its behalf. The DoE admin surface has the same three
  // operations as a fallback for a company that has lost its key and has no open
  // application to reach this screen from.
  //
  // These endpoints issue a credential for the PARTNER api; nothing here
  // authenticates with one. The company always comes from the authenticated
  // context, so a caller cannot mint or list a credential for anyone else.
  // ---------------------------------------------------------------------------

  @Post('api-keys')
  @HttpCode(HttpStatus.CREATED)
  @DoeResponse({
    operationId: 'issueApplicationApiKey',
    status: HttpStatus.CREATED,
    type: IssuedApiKeyDto,
    description:
      'Mints an API key for the authenticated company and returns it with the plaintext secret. **The secret is shown exactly once** — it is stored only as a hash and cannot be retrieved again, so a lost key is replaced rather than recovered. Several live keys per company are allowed, which is how a credential is rotated without downtime.',
  })
  async issueApiKey(
    @CurrentCompany() company: CompanyDto,
    @CurrentUser() user: DMRUser,
    @Body() input: CreateApiKeyDto,
  ): Promise<IssuedApiKeyDto> {
    return this.apiKeyService.issue({
      company,
      createdVia: ApiKeyOriginEnum.ISLAND_IS,
      actorNationalId: resolveActorNationalId(user),
      label: input.label,
      scopes: input.scopes,
      expiresAt: input.expiresAt,
    })
  }

  @Get('api-keys')
  @DoeResponse({
    operationId: 'getApplicationApiKeys',
    type: GetApiKeysResponseDto,
    description:
      'Every API key the authenticated company holds, newest first. Revoked and expired keys are included so the list doubles as an audit view. Never contains a secret — none is recoverable.',
  })
  async getApiKeys(
    @CurrentCompany() company: CompanyDto,
  ): Promise<GetApiKeysResponseDto> {
    return { apiKeys: await this.apiKeyService.list(company.id) }
  }

  @Delete('api-keys/:id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The key\'s `id` as listed, not the `keyId` inside the credential.',
  })
  @DoeResponse({
    operationId: 'revokeApplicationApiKey',
    type: ApiKeyDto,
    include404: true,
    description:
      'Revokes one of the authenticated company\'s keys. Idempotent — re-revoking leaves the original actor and timestamp intact rather than overwriting the audit trail. A key belonging to another company answers 404, not 403.',
  })
  async revokeApiKey(
    @Param('id') id: string,
    @CurrentCompany() company: CompanyDto,
    @CurrentUser() user: DMRUser,
  ): Promise<ApiKeyDto> {
    return this.apiKeyService.revoke({
      id,
      company,
      actorNationalId: resolveActorNationalId(user),
    })
  }
}
