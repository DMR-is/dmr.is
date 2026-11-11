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

import {
  ApplicationCompanyDto,
  ApplicationReportCommentDto,
  ApplicationReportDetailDto,
  EditEqualityContentDto,
  EditOutliersDto,
  GetApplicationReportsResponseDto,
  GetSubCriterionCatalogResponseDto,
  IApplicationService,
  SalaryReportEligibilityDto,
  SubmitApplicationReportCommentDto,
  SubmitEqualityReportDto,
  SubmitSalaryReportDto,
} from '@dmr.is/doe-modules/application'
import { CompanyDto } from '@dmr.is/doe-modules/company'
import {
  IImportUploadService,
  ImportKeyDto,
  ImportUploadBoundary,
  PresignUploadResponseDto,
} from '@dmr.is/doe-modules/import-upload'
import { IPartnerClientService } from '@dmr.is/doe-modules/partner-client'
import { EqualityReportSummaryDto } from '@dmr.is/doe-modules/report'
import { CreateReportResponseDto } from '@dmr.is/doe-modules/report-create'
import { GetReportOutliersResponseDto } from '@dmr.is/doe-modules/report-employee'
import {
  IReportExcelService,
  ParsedReportDto,
} from '@dmr.is/doe-modules/report-excel'
import {
  SalaryAnalysisRequestDto,
  SalaryAnalysisResponseDto,
} from '@dmr.is/doe-modules/report-statistics'
import { PagingQuery } from '@dmr.is/shared-dto'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AutoProvisionCompany } from '../../core/decorators/auto-provision-company.decorator'
import { CurrentCompany } from '../../core/decorators/current-company.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { contentDisposition } from '../../core/http/content-disposition'

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
    @Inject(IPartnerClientService)
    private readonly partnerClientService: IPartnerClientService,
  ) {}

  @Get('company')
  @DoeResponse({
    operationId: 'getApplicationCompany',
    description:
      'The company the signed-in organisation resolves to, as in the register. `isServiceProvider` says whether the organisation is also an approved service provider (þjónustuaðili): it comes from the same live-partner-client lookup that guards `GET /application/partner-client`, so it is `true` exactly when those provider routes answer rather than 404.',
    type: ApplicationCompanyDto,
  })
  async getCompany(
    @CurrentCompany() company: CompanyDto,
  ): Promise<ApplicationCompanyDto> {
    // The same call `PartnerClientResourceGuard` makes, so the flag cannot say
    // yes while the provider routes say 404. `company.nationalId` is the
    // token's kennitala — `CompanyResourceGuard` resolved the row by it.
    const partnerClient = await this.partnerClientService.findLiveByNationalId(
      company.nationalId,
    )

    return { ...company, isServiceProvider: partnerClient !== null }
  }

  @Get('reports')
  @DoeResponse({
    operationId: 'getApplicationReports',
    description:
      "The resolved company's submitted equality reports (jafnréttisáætlanir) and salary reports (jafnlaunaskýrslur), newest first. Exactly the reports `GET /application/reports/:providerId` opens for this company: each row's `providerId` is the handle that route takes, and a report the detail route would 404 on is never listed. Group reports appear only for the parent company that filed them — a subsidiary covered by a group report cannot open it, so it does not see it here either. Drafts are not listed: a draft is not a submission yet, and is reached through its own application under `reports/:providerId/draft`. Reports from every channel are listed: those the company filed on island.is, those a service provider filed for it over the partner API, and those Jafnréttisstofa entered for it; `submittedVia` says which. Every row opens with the read routes (detail, equality PDF, outliers, comments); only `ISLAND_IS` rows can be edited, commented on or withdrawn here. A report stored with no provider id — some entered by Jafnréttisstofa before ids were assigned — has no handle on any applicant route, so it is neither listed here nor openable. Withdrawn, denied and superseded reports are listed with their status. Empty when the company has filed nothing; 404 only when the authenticated kennitala has no company row yet.",
    type: GetApplicationReportsResponseDto,
    include404: true,
  })
  async getReports(
    @CurrentCompany() company: CompanyDto,
  ): Promise<GetApplicationReportsResponseDto> {
    return this.applicationService.listReports(company)
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
  async importWorkbook(@Body() body: ImportKeyDto): Promise<ParsedReportDto> {
    // Not a `finally`. The download happens inside `importWorkbook` now, so a
    // transient S3 failure reaches this scope — and deleting the staged object
    // there destroys the only copy of an upload the caller can still retry.
    // `cleanupAfter` owns which outcomes are terminal; see `import-upload`.
    try {
      // The key, not a buffer: the service downloads under the parse gate so
      // the workbook is never in memory without a slot.
      const parsed = await this.reportExcelService.importWorkbook(
        body.key,
        ImportUploadBoundary.APPLICATION,
      )
      await this.importUploadService.cleanupAfter(
        body.key,
        ImportUploadBoundary.APPLICATION,
      )
      return parsed
    } catch (e) {
      await this.importUploadService.cleanupAfter(
        body.key,
        ImportUploadBoundary.APPLICATION,
        e,
      )
      throw e
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
      "Returns whatever currently meets the resolved company's equality obligation, and **`source` says which of the two it is**. `REPORT` is an APPROVED, in-force equality report filed here: the portal references the returned `id` as `equalityReportId` when submitting a salary report, and passes `providerId` to `GET /application/reports/:providerId` to read the report itself. `LEGACY` is an unexpired certificate from the Directorate's retired register — it has no report row behind it, so `id`, `identifier`, `providerId` and `approvedAt` are all null and only `validUntil` is populated; the portal omits `equalityReportId` on submission and the server records the legacy basis on the report. Branch on `source`, not on a null `id`. Neither `id` nor `identifier` is a lookup handle here: `id` only resolves against the admin-only `GET /reports/:id`, and `identifier` is a human-facing display code. A **404** means neither kind of coverage is in force.",
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
      'Pre-flight check of whether the resolved company may submit a salary report right now, with a machine-readable `reason` when blocked so the application portal can gate entry into the flow. One precondition is checked: the company’s equality obligation must be met (`MISSING_EQUALITY_REPORT`) — by an APPROVED, in-force equality report filed here **or** by an unexpired certificate from the Directorate’s retired register, the same two the admin register counts. A company registered as a sveitarfélag (sector `SVEITARFELAG`) is exempt and is never refused for this reason — so for a plan-less municipality this route says `eligible: true` while `GET reports/equality/active` still 404s; do not gate the submission on the latter. Enforced as a 404 on `POST reports/salary`.\n\nThere is no longer any timing restriction: the 6-month renewal window was removed and a company may file however far out its current deadline is. Filing early is not free, though — a report’s three years run from APPROVAL, so whatever is left on the current certificate is absorbed rather than added, and a company with a year still to run gets three years from today instead of four. `earliestNewDueAt` (what filing now would earn) against `dueAt` (what they have) is the size of that trade, returned whether or not `eligible` is true so the portal can put it to the applicant before they start.',
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
    include409: true,
    description:
      'Files a salary report for the resolved company. There is no timing restriction — the 6-month renewal window was removed, and a company may file however far out its current deadline is. See `GET reports/salary/eligibility` for what filing early costs.\n\n404 when the company has no equality coverage to file against — neither an APPROVED, in-force equality report nor an unexpired certificate on the retired register — and is not an exempt sveitarfélag (`GET reports/salary/eligibility` reports the same as `MISSING_EQUALITY_REPORT`). An exempt company files with `equalityReportId` omitted.\n\n409 on two distinct refusals: (1) the company already has a SALARY report in IN_REVIEW or POSTPONED, which a reviewer is mid-workflow on (a merely SUBMITTED predecessor is withdrawn silently instead, and does not 409); (2) the `(providerType, providerId)` tuple is already registered to a different company, or to a report of the other type. The two are not distinguished in the response body today; the reason is in `message`.',
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
      'Read handle from `GET /application/reports`: the bare island.is application UUID, `partner:<provider’s own id>` for a report a service provider filed, or `system:<id>` for one Jafnréttisstofa entered. URL-encode it as one segment. Resolved only among reports whose parent company is the authenticated company.',
  })
  @DoeResponse({
    operationId: 'getApplicationReport',
    include404: true,
    description:
      'Returns company-facing report detail with external comments. Read-only across channels: opens any report `GET /application/reports` lists for this company — filed on island.is, by a service provider over the partner API, or by Jafnréttisstofa — under the same ownership rule. Only island.is-filed reports can be changed through the write routes.',
    type: ApplicationReportDetailDto,
  })
  async getReport(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<ApplicationReportDetailDto> {
    return this.applicationService.getReport(providerId, company)
  }

  /**
   * The company's own uploaded jafnréttisáætlun, read back.
   *
   * The report detail withholds the PDF bytes (they are megabytes of base64),
   * so this is how an applicant sees the plan they submitted — which matters
   * most during a correction, where they are being asked to revise a document
   * they would otherwise have no way to look at.
   */
  @Get('reports/:providerId/equality-content/pdf')
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      'Read handle from `GET /application/reports`: the bare island.is application UUID, `partner:<provider’s own id>` for a report a service provider filed, or `system:<id>` for one Jafnréttisstofa entered. URL-encode it as one segment. Resolved only among reports whose parent company is the authenticated company.',
  })
  @DoeResponse({
    operationId: 'getApplicationEqualityContentPdf',
    include404: true,
    produces: 'application/pdf',
    successDescription:
      'Returns the uploaded jafnréttisáætlun PDF verbatim. 404 when the ' +
      "report's equality content is HTML rather than an uploaded PDF. " +
      'Takes any read handle from `GET /application/reports`, whichever channel filed the report.',
  })
  async getEqualityContentPdf(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<StreamableFile> {
    const { pdf, fileName } =
      await this.applicationService.getEqualityContentPdf(providerId, company)

    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: contentDisposition('inline', fileName),
    })
  }

  @Get('reports/:providerId/outliers')
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      'Read handle from `GET /application/reports`: the bare island.is application UUID, `partner:<provider’s own id>` for a report a service provider filed, or `system:<id>` for one Jafnréttisstofa entered. URL-encode it as one segment. Resolved only among reports whose parent company is the authenticated company.',
  })
  @DoeResponse({
    operationId: 'getApplicationReportOutliers',
    include404: true,
    description:
      "Paginated list of the report's employee outliers. Split out from the report-detail payload because a single salary report can carry hundreds of rows. Ordered by role title and then by the employee's ordinal within the report — the same grouped-by-role order the draft employee lists serve. Read-only across channels: takes any read handle from `GET /application/reports`. Changing the explanations (`PUT …/outliers`) is island.is-only.",
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
      'Read handle from `GET /application/reports`: the bare island.is application UUID, `partner:<provider’s own id>` for a report a service provider filed, or `system:<id>` for one Jafnréttisstofa entered. URL-encode it as one segment. Resolved only among reports whose parent company is the authenticated company.',
  })
  @DoeResponse({
    operationId: 'getApplicationReportComments',
    include404: true,
    description:
      "The report's external comment thread on its own, ordered oldest-first. Only comments with `EXTERNAL` visibility are returned — reviewer-internal notes are never exposed to the applicant. Use this instead of re-fetching the report detail when only the conversation is needed; the same list is embedded as `externalComments` in `GET /application/reports/:providerId`. Takes any read handle from `GET /application/reports`; posting a comment is island.is-only.",
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
      'The island.is application UUID only. This write route acts on reports the company filed on island.is: a `partner:` or `system:` handle answers 404, because a report filed through another channel is changed through that channel.',
  })
  @DoeResponse({
    operationId: 'submitApplicationReportComment',
    status: 201,
    include404: true,
    description:
      'Submits an external comment on a report owned by the authenticated company. island.is-filed reports only: the comment thread of a report filed through another channel can be read here but not written to.',
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
      'The island.is application UUID only. This write route acts on reports the company filed on island.is: a `partner:` or `system:` handle answers 404, because a report filed through another channel is changed through that channel.',
  })
  @DoeResponse({
    operationId: 'editApplicationEqualityContent',
    include404: true,
    description:
      'Replaces the narrative body of an EQUALITY report in place. Allowed only on reports in status `IN_REVIEW`. Emits an `EDITED` event; status is preserved. island.is-filed reports only.',
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
      'The island.is application UUID only. This write route acts on reports the company filed on island.is: a `partner:` or `system:` handle answers 404, because a report filed through another channel is changed through that channel.',
  })
  @DoeResponse({
    operationId: 'editApplicationOutliers',
    include404: true,
    description:
      'Replaces outlier explanations on a SALARY report. All-or-none — the submitted set must match the canonical detected outliers exactly. Allowed in status `POSTPONED` (transitions to `SUBMITTED`) or `IN_REVIEW` (status preserved). Always emits `EDITED`; the `POSTPONED → SUBMITTED` case additionally emits `STATUS_CHANGED`. island.is-filed reports only.',
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
      'The island.is application UUID only. This write route acts on reports the company filed on island.is: a `partner:` or `system:` handle answers 404, because a report filed through another channel is changed through that channel.',
  })
  @DoeResponse({
    operationId: 'withdrawApplicationReport',
    status: HttpStatus.NO_CONTENT,
    include404: true,
    description:
      'Withdraws the report tied to an island.is application the applicant deleted upstream. Sets status to `WITHDRAWN` and emits `STATUS_CHANGED`. Allowed only before the report reaches a terminal state (`APPROVED`/`DENIED`/`SUPERSEDED`); idempotent on an already-`WITHDRAWN` report. island.is-filed reports only.',
  })
  async withdrawReport(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<void> {
    return this.applicationService.withdraw(providerId, company)
  }
}
