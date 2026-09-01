import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common'
import { ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger'

import {
  ApplicationReportDetailDto,
  IApplicationService,
  SalaryReportEligibilityDto,
  SubmitEqualityReportDto,
  SubmitSalaryReportDto,
} from '@dmr.is/doe-modules/application'
import { GetSubCriterionCatalogResponseDto } from '@dmr.is/doe-modules/application'
import { CompanyDto } from '@dmr.is/doe-modules/company'
import {
  IImportUploadService,
  ImportKeyDto,
  ImportUploadBoundary,
  PresignUploadResponseDto,
} from '@dmr.is/doe-modules/import-upload'
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
import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'
import { PagingQuery } from '@dmr.is/shared-dto'

import { CurrentCompany } from '../../core/decorators/current-company.decorator'
import { PartnerResponse } from '../../core/decorators/partner-response.decorator'
import { ApiKeyGuard } from '../../core/guards/api-key/api-key.guard'
import { RequireApiScope } from '../../core/guards/api-key-scope/require-api-scope.decorator'
import { RequireApiScopeGuard } from '../../core/guards/api-key-scope/require-api-scope.guard'
import { ApiKeyThrottlerGuard } from '../../core/guards/api-key-throttler/api-key-throttler.guard'
import { PartnerCompanyGuard } from '../../core/guards/partner-company/partner-company.guard'

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/**
 * The public third-party surface.
 *
 * Thin by design: every operation delegates to the same services the island.is
 * surface uses. The only thing this controller decides is who may call it and
 * what shape the public contract has — the submission rules, the
 * equality-precedes-salary gate, idempotent replay and event emission all live
 * one layer down and are shared, so the two channels cannot drift.
 *
 * Guard order matters and is not arbitrary:
 *
 *   ApiKeyGuard            who is calling
 *   PartnerCompanyGuard    which company that key belongs to
 *   RequireApiScopeGuard   whether the key may do this
 *   ApiKeyThrottlerGuard   how often, bucketed per key
 *
 * The scope and throttler guards both read what ApiKeyGuard puts on the request,
 * so they cannot run before it. The throttler is last because a request that is
 * about to be refused for scope should not consume the caller's allowance.
 */
@Controller({
  path: 'partner',
  version: '1',
})
@ApiTags('Partner')
@ApiSecurity('apiKey')
@UseGuards(
  ApiKeyGuard,
  PartnerCompanyGuard,
  RequireApiScopeGuard,
  ApiKeyThrottlerGuard,
)
export class PartnerController {
  constructor(
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
    @Inject(IReportExcelService)
    private readonly reportExcelService: IReportExcelService,
    @Inject(IImportUploadService)
    private readonly importUploadService: IImportUploadService,
  ) {}

  @Get('company')
  @RequireApiScope(ApiKeyScopeEnum.REPORT_READ)
  @PartnerResponse({
    operationId: 'getPartnerCompany',
    type: CompanyDto,
    description:
      'The company this API key belongs to. Useful as a first call to confirm a key is live and points where the integrator expects — the company is never taken from a request, only from the key.',
  })
  getCompany(@CurrentCompany() company: CompanyDto): CompanyDto {
    return company
  }

  @Get('reports/equality/active')
  @RequireApiScope(ApiKeyScopeEnum.REPORT_READ)
  @PartnerResponse({
    operationId: 'getPartnerActiveEqualityReport',
    type: EqualityReportSummaryDto,
    include404: true,
    description:
      'The company’s currently approved equality report. Its `id` is what a salary submission must reference as `equalityReportId` — a salary report cannot be filed without an approved equality report behind it, so this is the first call in the salary flow.',
  })
  getActiveEqualityReport(
    @CurrentCompany() company: CompanyDto,
  ): Promise<EqualityReportSummaryDto> {
    return this.applicationService.getActiveEqualityReport(company)
  }

  @Get('reports/salary/eligibility')
  @RequireApiScope(ApiKeyScopeEnum.REPORT_READ)
  @PartnerResponse({
    operationId: 'getPartnerSalaryReportEligibility',
    type: SalaryReportEligibilityDto,
    description:
      'Whether the company may file a salary report now, and why not if it may not. Worth calling before building a payload: it is cheaper than discovering the renewal window from a rejected submission.',
  })
  getSalaryReportEligibility(
    @CurrentCompany() company: CompanyDto,
  ): Promise<SalaryReportEligibilityDto> {
    return this.applicationService.getSalaryReportEligibility(company)
  }

  @Get('sub-criteria/catalog')
  @RequireApiScope(ApiKeyScopeEnum.REPORT_READ)
  @PartnerResponse({
    operationId: 'getPartnerSubCriterionCatalog',
    type: GetSubCriterionCatalogResponseDto,
    description:
      'Jafnréttisstofa’s catalog of sub-criteria and the generic step scale, as the workbook template uses them. Reference data for building a criteria tree without the spreadsheet.',
  })
  getSubCriterionCatalog(): GetSubCriterionCatalogResponseDto {
    return this.applicationService.getSubCriterionCatalog()
  }

  @Get('reports/excel/template')
  @RequireApiScope(ApiKeyScopeEnum.REPORT_READ)
  @Header('Content-Disposition', 'attachment; filename="template.xlsx"')
  @PartnerResponse({
    operationId: 'getPartnerBlankExcelTemplate',
    produces: XLSX_MIME,
    description:
      'The blank salary-report workbook. The same file the employer downloads from island.is, so a vendor can prefill it rather than asking a customer to fill it by hand.',
  })
  async getBlankExcelTemplate(): Promise<StreamableFile> {
    return new StreamableFile(
      await this.reportExcelService.generateBlankTemplate(),
      { type: XLSX_MIME },
    )
  }

  @Post('reports/excel/presign')
  @RequireApiScope(ApiKeyScopeEnum.SALARY_SUBMIT)
  @PartnerResponse({
    operationId: 'presignPartnerImportUpload',
    type: PresignUploadResponseDto,
    description:
      'A short-lived URL to PUT a filled workbook to, and the `key` to quote when importing it. The workbook goes to storage directly rather than through this API, which is what keeps a several-megabyte upload off the request path.',
  })
  presignImportUpload(): Promise<PresignUploadResponseDto> {
    return this.importUploadService.createUpload(ImportUploadBoundary.APPLICATION)
  }

  @Post('reports/excel/import')
  @RequireApiScope(ApiKeyScopeEnum.SALARY_SUBMIT)
  @PartnerResponse({
    operationId: 'importPartnerSalaryReportWorkbook',
    type: ParsedReportDto,
    description:
      'Parses an uploaded workbook into the `parsed` payload a salary submission carries. Parse only — nothing is stored, so a vendor can import, inspect the result, and decide whether to submit.',
  })
  async importSalaryReportWorkbook(
    @Body() input: ImportKeyDto,
  ): Promise<ParsedReportDto> {
    // Not a `finally`, and no longer "cleaned up whether it succeeded or
    // threw" — that rule was written when the download happened before this
    // scope, so a transient storage failure could never reach it. It can now.
    // A vendor whose upload is deleted on an S3 blip has to redo the presign,
    // the PUT and the parse; the storage cost of keeping it is one lifecycle
    // sweep. `cleanupAfter` decides which outcomes are terminal.
    try {
      // The key, not a buffer: the service downloads under the parse gate so
      // the workbook is never in memory without a slot.
      const parsed = await this.reportExcelService.importWorkbook(
        input.key,
        ImportUploadBoundary.APPLICATION,
      )
      await this.importUploadService.cleanupAfter(
        input.key,
        ImportUploadBoundary.APPLICATION,
      )
      return parsed
    } catch (e) {
      await this.importUploadService.cleanupAfter(
        input.key,
        ImportUploadBoundary.APPLICATION,
        e,
      )
      throw e
    }
  }

  @Post('reports/salary-analysis')
  @RequireApiScope(ApiKeyScopeEnum.SALARY_SUBMIT)
  @PartnerResponse({
    operationId: 'analyzePartnerSalaryReport',
    type: SalaryAnalysisResponseDto,
    description:
      'Runs the outlier analysis over a payload without submitting it. This is how a vendor finds out which employees will need an explanation before filing, rather than after.',
  })
  analyzeSalaryReport(
    @Body() input: SalaryAnalysisRequestDto,
    @CurrentCompany() company: CompanyDto,
  ): Promise<SalaryAnalysisResponseDto> {
    return this.applicationService.salaryAnalysis(input, company)
  }

  @Post('reports/salary')
  @RequireApiScope(ApiKeyScopeEnum.SALARY_SUBMIT)
  @HttpCode(HttpStatus.CREATED)
  @PartnerResponse({
    operationId: 'submitPartnerSalaryReport',
    status: HttpStatus.CREATED,
    type: CreateReportResponseDto,
    description:
      'Files a salary report. `providerId` is the vendor’s own id for the submission and is stored namespaced by the company, so two vendors may use the same id freely. Idempotent: re-sending the same `providerId` for the same company returns the original `reportId` rather than filing twice, which makes a network retry safe. **A 503 means the write collided and should be retried** — it does not mean the payload was wrong.',
  })
  submitSalaryReport(
    @Body() input: SubmitSalaryReportDto,
    @CurrentCompany() company: CompanyDto,
  ): Promise<CreateReportResponseDto> {
    return this.applicationService.submitSalary(input, company)
  }

  @Post('reports/equality')
  @RequireApiScope(ApiKeyScopeEnum.EQUALITY_SUBMIT)
  @HttpCode(HttpStatus.CREATED)
  @PartnerResponse({
    operationId: 'submitPartnerEqualityReport',
    status: HttpStatus.CREATED,
    type: CreateReportResponseDto,
    description:
      'Files an equality report — the narrative document that must be approved before any salary report can reference it. Same `providerId` and idempotency rules as the salary submission.',
  })
  submitEqualityReport(
    @Body() input: SubmitEqualityReportDto,
    @CurrentCompany() company: CompanyDto,
  ): Promise<CreateReportResponseDto> {
    return this.applicationService.submitEquality(input, company)
  }

  @Get('reports/:providerId')
  @RequireApiScope(ApiKeyScopeEnum.REPORT_READ)
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      'The vendor’s own submission id, exactly as sent when filing. The namespacing applied on write is applied here too, so a vendor quotes its own id and never sees the stored form.',
  })
  @PartnerResponse({
    operationId: 'getPartnerReport',
    type: ApplicationReportDetailDto,
    include404: true,
    description:
      'Status and detail of a submitted report — where it is in review, its deadlines, and any reviewer comments. This is how a vendor learns a report was approved or denied. Only reports filed through this channel are visible: a report the company filed on island.is is not readable here.',
  })
  getReport(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<ApplicationReportDetailDto> {
    return this.applicationService.getReport(providerId, company)
  }

  @Get('reports/:providerId/outliers')
  @RequireApiScope(ApiKeyScopeEnum.REPORT_READ)
  @ApiParam({ name: 'providerId', type: String })
  @PartnerResponse({
    operationId: 'getPartnerReportOutliers',
    type: GetReportOutliersResponseDto,
    include404: true,
    description:
      'The detected outliers on a submitted report, paginated. Separate from the report detail because the list can be long on a large employer.',
  })
  getReportOutliers(
    @Param('providerId') providerId: string,
    @Query() query: PagingQuery,
    @CurrentCompany() company: CompanyDto,
  ): Promise<GetReportOutliersResponseDto> {
    return this.applicationService.getReportOutliers(providerId, company, query)
  }
}
