import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { Response } from 'express'

import {
  ApplicationReportDetailDto,
  IApplicationService,
  SalaryReportEligibilityDto,
  SubmitEqualityReportDto,
  SubmitPartnerSalaryReportDto,
} from '@dmr.is/doe-modules/application'
import { GetSubCriterionCatalogResponseDto } from '@dmr.is/doe-modules/application'
import {
  CompanyDto,
  PartnerCompanyDto,
  toPartnerCompanyDto,
} from '@dmr.is/doe-modules/company'
import { EqualityReportSummaryDto } from '@dmr.is/doe-modules/report'
import { CreateReportResponseDto } from '@dmr.is/doe-modules/report-create'
import { GetReportOutliersResponseDto } from '@dmr.is/doe-modules/report-employee'
import {
  SalaryAnalysisRequestDto,
  SalaryAnalysisResponseDto,
} from '@dmr.is/doe-modules/report-statistics'
import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'
import { PagingQuery } from '@dmr.is/shared-dto'

import { CurrentCompany } from '../../core/decorators/current-company.decorator'
import { PartnerResponse } from '../../core/decorators/partner-response.decorator'
import { RequireActiveCompany } from '../../core/guards/active-company/require-active-company.decorator'
import { RequireActiveCompanyGuard } from '../../core/guards/active-company/require-active-company.guard'
import { ApiKeyGuard } from '../../core/guards/api-key/api-key.guard'
import { RequireApiScope } from '../../core/guards/api-key-scope/require-api-scope.decorator'
import { RequireApiScopeGuard } from '../../core/guards/api-key-scope/require-api-scope.guard'
import { ApiKeyThrottlerGuard } from '../../core/guards/api-key-throttler/api-key-throttler.guard'
import { PartnerCompanyGuard } from '../../core/guards/partner-company/partner-company.guard'

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
 *   ApiKeyGuard                who is calling
 *   PartnerCompanyGuard        which company that key belongs to
 *   RequireApiScopeGuard       whether the key may do this
 *   RequireActiveCompanyGuard  whether that company may use this API at all
 *   ApiKeyThrottlerGuard       how often, bucketed per key
 *
 * The scope and throttler guards both read what ApiKeyGuard puts on the request,
 * and the active-company guard reads what PartnerCompanyGuard resolves, so
 * neither can run before its source. The throttler is last because a request
 * that is about to be refused for scope or for an inactive company should not
 * consume the caller's allowance.
 *
 * `@RequireActiveCompany` is declared once on the controller rather than per
 * handler, so a company that has fallen off the register cannot reach ANY of
 * this API — reads included. One unmistakable answer beats a surface that
 * half-works, and every route here answers 409 for it, which is why
 * `PartnerResponse` carries that status by default.
 */
@Controller({
  path: 'partner',
  version: '1',
})
@ApiTags('Partner')
@ApiSecurity('apiKey')
@RequireActiveCompany()
@UseGuards(
  ApiKeyGuard,
  PartnerCompanyGuard,
  RequireApiScopeGuard,
  RequireActiveCompanyGuard,
  ApiKeyThrottlerGuard,
)
export class PartnerController {
  constructor(
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
  ) {}

  @Get('company')
  @RequireApiScope(ApiKeyScopeEnum.REPORT_READ)
  @PartnerResponse({
    operationId: 'getPartnerCompany',
    type: PartnerCompanyDto,
    description:
      'The company this API key belongs to. Useful as a first call to confirm a key is live and points where the integrator expects — the company is never taken from a request, only from the key. A narrow projection: the Directorate’s own working state (fines, quarantine, admin overrides, RSK bookkeeping, internal keys) is not part of this contract — see `PartnerCompanyDto`.',
  })
  getCompany(@CurrentCompany() company: CompanyDto): PartnerCompanyDto {
    // Projected, never returned whole. `CompanyDto` is the back office's view
    // and grows with the admin UI's needs; handing it to a vendor publishes
    // every one of those additions by default.
    return toPartnerCompanyDto(company)
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
      'Jafnréttisstofa’s catalog of sub-criteria and the generic step scale. Reference data for building the criteria tree a submission carries — the authoritative list of what may be scored and on what steps, so a vendor maps its own job data onto it rather than guessing.',
  })
  getSubCriterionCatalog(): GetSubCriterionCatalogResponseDto {
    return this.applicationService.getSubCriterionCatalog()
  }

  @Post('reports/salary-analysis')
  @RequireApiScope(ApiKeyScopeEnum.SALARY_SUBMIT)
  @PartnerResponse({
    operationId: 'analyzePartnerSalaryReport',
    type: SalaryAnalysisResponseDto,
    description:
      'Validates a payload and runs the outlier analysis over it, without submitting anything. **This is the first half of the salary flow and is not optional in practice:** it is where a vendor learns that its payload parses, that its criteria tree is accepted, and which employees will need an explanation — all of which the submission would otherwise refuse for the first time. Nothing is stored, so it can be called as often as the payload changes; when the answer looks right, the same payload goes to `POST /reports/salary`.',
  })
  analyzeSalaryReport(
    @Body() input: SalaryAnalysisRequestDto,
    @CurrentCompany() company: CompanyDto,
  ): Promise<SalaryAnalysisResponseDto> {
    return this.applicationService.salaryAnalysis(input, company)
  }

  @Post('reports/salary')
  @RequireApiScope(ApiKeyScopeEnum.SALARY_SUBMIT)
  @PartnerResponse({
    operationId: 'submitPartnerSalaryReport',
    status: HttpStatus.CREATED,
    type: CreateReportResponseDto,
    alsoSucceedsWith: {
      status: HttpStatus.OK,
      description:
        'Replayed. The `providerId` had already been used, so nothing was filed and `reportId` names the report that submission created earlier — the body just sent was not read. A corrected re-file needs a NEW `providerId`; see `replayed`.',
    },
    description:
      'Files a salary report. The equality report it is audited against is resolved server-side — the company’s approved, in-force one, the same report `GET /reports/equality/active` returns — so it is not part of this body; a **404** means there is none, and section A has to happen first. `providerId` is the vendor’s own id for the submission and is stored namespaced by the company, so two vendors may use the same id freely. Idempotent: re-sending the same `providerId` for the same company returns the original `reportId` rather than filing twice, which makes a network retry safe. **A 503 means the write collided and should be retried** — it does not mean the payload was wrong. A **409** means the company’s own state prevents filing right now: it is not active in the register, the renewal window is not open, or a previous report is still in review — the response says which.',
  })
  async submitSalaryReport(
    @Body() input: SubmitPartnerSalaryReportDto,
    @CurrentCompany() company: CompanyDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CreateReportResponseDto> {
    const result = await this.applicationService.submitSalary(input, company)

    return this.answerCreated(res, result)
  }

  @Post('reports/equality')
  @RequireApiScope(ApiKeyScopeEnum.EQUALITY_SUBMIT)
  @PartnerResponse({
    operationId: 'submitPartnerEqualityReport',
    status: HttpStatus.CREATED,
    type: CreateReportResponseDto,
    alsoSucceedsWith: {
      status: HttpStatus.OK,
      description:
        'Replayed — as on the salary submission. Nothing was filed and the body was not read.',
    },
    description:
      'Files an equality report — the narrative document that must be approved before any salary report can reference it. Same `providerId` and idempotency rules as the salary submission. A **409** means the company’s own state prevents filing: it is not active in the register, or a previous equality report is still in review.',
  })
  async submitEqualityReport(
    @Body() input: SubmitEqualityReportDto,
    @CurrentCompany() company: CompanyDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CreateReportResponseDto> {
    const result = await this.applicationService.submitEquality(input, company)

    return this.answerCreated(res, result)
  }

  /**
   * `201 Created` only when something was created.
   *
   * A replay creates nothing — it hands back a report an earlier call filed —
   * and answering `201` for it is a plain untruth that costs a vendor real
   * data: re-file a corrected report under a used `providerId` and the status
   * code, the `reportId` and a follow-up read by provider id all agree that a
   * correction landed when nothing was read. `200` is the honest answer, and it
   * is the one a naive `assert status === 201` catches. Changed while this
   * surface has no integrators to break.
   */
  private answerCreated(
    res: Response,
    result: CreateReportResponseDto,
  ): CreateReportResponseDto {
    res.status(result.replayed ? HttpStatus.OK : HttpStatus.CREATED)

    return result
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
