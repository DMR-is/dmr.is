import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'

import { PagingQuery } from '@dmr.is/shared-dto'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AutoProvisionCompany } from '../../core/decorators/auto-provision-company.decorator'
import { CurrentCompany } from '../../core/decorators/current-company.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { SalaryAnalysisResponseDto } from '../application/dto/salary-analysis.response.dto'
import { CompanyDto } from '../company/dto/company.dto'
import { ImportKeyDto } from '../import-upload/dto/import-key.dto'
import { ReportProviderEnum } from '../report/models/report.enums'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { IReportDraftAnalysisService } from './analysis/report-draft-analysis.service.interface'
import { DraftAssignmentDto } from './assignment/dto/draft-assignment.dto'
import { IReportDraftAssignmentService } from './assignment/report-draft-assignment.service.interface'
import { GetDraftCriteriaResponseDto } from './criterion/dto/get-draft-criteria-response.dto'
import { IReportDraftCriterionService } from './criterion/report-draft-criterion.service.interface'
import { CreateDraftReportDto } from './draft/dto/create-draft-report.dto'
import { DraftDetailDto } from './draft/dto/draft-detail.dto'
import { UpdateDraftDto } from './draft/dto/update-draft.dto'
import { IReportDraftService } from './draft/report-draft.service.interface'
import { GetDraftEmployeesResponseDto } from './employee/dto/get-draft-employees-response.dto'
import { IReportDraftEmployeeService } from './employee/report-draft-employee.service.interface'
import { EmployeeOutlierGroupDto } from './outlier-group/dto/employee-outlier-group.dto'
import { GetDraftOutlierGroupsResponseDto } from './outlier-group/dto/get-draft-outlier-groups-response.dto'
import { IReportDraftOutlierGroupService } from './outlier-group/report-draft-outlier-group.service.interface'
import { GetDraftRolesResponseDto } from './role/dto/get-draft-roles-response.dto'
import { IReportDraftRoleService } from './role/report-draft-role.service.interface'
import { IReportDraftSeedService } from './seed/report-draft-seed.service.interface'
import { GetDraftStepsResponseDto } from './step/dto/get-draft-steps-response.dto'
import { IReportDraftStepService } from './step/report-draft-step.service.interface'
import { GetDraftSubCriteriaResponseDto } from './sub-criterion/dto/get-draft-sub-criteria-response.dto'
import { IReportDraftSubCriterionService } from './sub-criterion/report-draft-sub-criterion.service.interface'
import { SubmitDraftDto } from './submit/dto/submit-draft.dto'
import { IReportDraftSubmitService } from './submit/report-draft-submit.service.interface'
import { SyncDraftDto } from './sync/dto/sync-draft.dto'
import { IReportDraftSyncService } from './sync/report-draft-sync.service.interface'

/**
 * Applicant-facing draft surface bound to the island.is application portal.
 * Shares the company-auth boundary (`CompanyResourceGuard` + `CurrentCompany`)
 * with `ApplicationController`. The draft lifecycle (create → submit → delete)
 * plus reads live here; all content mutation goes through the single bulk
 * `POST …/draft/sync` endpoint (the portal flushes a screen's changes at once).
 */
const APPLICATION_REPORT_PROVIDER = ReportProviderEnum.ISLAND_IS

@Controller({
  path: 'application',
  version: '1',
})
@ApiTags('Application')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, CompanyResourceGuard)
export class ReportDraftController {
  constructor(
    @Inject(IReportDraftService)
    private readonly reportDraftService: IReportDraftService,
    @Inject(IReportDraftSyncService)
    private readonly reportDraftSyncService: IReportDraftSyncService,
    @Inject(IReportDraftRoleService)
    private readonly reportDraftRoleService: IReportDraftRoleService,
    @Inject(IReportDraftEmployeeService)
    private readonly reportDraftEmployeeService: IReportDraftEmployeeService,
    @Inject(IReportDraftCriterionService)
    private readonly reportDraftCriterionService: IReportDraftCriterionService,
    @Inject(IReportDraftSubCriterionService)
    private readonly reportDraftSubCriterionService: IReportDraftSubCriterionService,
    @Inject(IReportDraftStepService)
    private readonly reportDraftStepService: IReportDraftStepService,
    @Inject(IReportDraftAssignmentService)
    private readonly reportDraftAssignmentService: IReportDraftAssignmentService,
    @Inject(IReportDraftAnalysisService)
    private readonly reportDraftAnalysisService: IReportDraftAnalysisService,
    @Inject(IReportDraftOutlierGroupService)
    private readonly reportDraftOutlierGroupService: IReportDraftOutlierGroupService,
    @Inject(IReportDraftSubmitService)
    private readonly reportDraftSubmitService: IReportDraftSubmitService,
    @Inject(IReportDraftSeedService)
    private readonly reportDraftSeedService: IReportDraftSeedService,
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────

  @Post('reports/draft')
  @HttpCode(HttpStatus.CREATED)
  @AutoProvisionCompany()
  @DoeResponse({
    operationId: 'createApplicationReportDraft',
    status: 201,
    type: CreateReportResponseDto,
    description:
      'Opens a DRAFT report at "initial contact" (the applicant leaving the prerequisites step upstream). The report is invisible to reviewers until submitted; the portal builds it up via the bulk sync endpoint. Idempotent on the upstream (provider_type, provider_id) tuple — a retried call returns the existing draft. Auto-provisions the company on first contact.',
  })
  async createDraft(
    @CurrentCompany() company: CompanyDto,
    @Body() input: CreateDraftReportDto,
  ): Promise<CreateReportResponseDto> {
    return this.reportDraftService.createDraft({
      type: input.type,
      providerType: APPLICATION_REPORT_PROVIDER,
      providerId: input.providerId,
      companyNationalId: company.nationalId,
    })
  }

  @Get('reports/:providerId/draft')
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      'Upstream island.is application UUID (provider_id) of the draft.',
  })
  @DoeResponse({
    operationId: 'getApplicationReportDraft',
    include404: true,
    type: DraftDetailDto,
    description:
      'Company-facing read of an in-progress DRAFT report: the report-level header plus child-collection counts. The children are fetched via their own paginated list endpoints. 404 if the draft does not exist, is not owned by the authenticated company, or has already been submitted.',
  })
  async getDraft(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<DraftDetailDto> {
    return this.reportDraftService.getDraftDetail(providerId, company)
  }

  @Patch('reports/:providerId/draft')
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      'Upstream island.is application UUID (provider_id) of the draft.',
  })
  @DoeResponse({
    operationId: 'updateApplicationReportDraft',
    include404: true,
    type: DraftDetailDto,
    description:
      'Patches report-level header fields (contact / admin / headcount / equality narrative) on a DRAFT report. PATCH semantics: omitted keys are left untouched, an explicit null clears the column. Returns the refreshed draft detail. 404 if the draft is not owned by the company or has already been submitted.',
  })
  async updateDraft(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: UpdateDraftDto,
  ): Promise<DraftDetailDto> {
    return this.reportDraftService.updateDraft(providerId, company, input)
  }

  @Delete('reports/:providerId/draft')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      'Upstream island.is application UUID (provider_id) of the draft.',
  })
  @DoeResponse({
    operationId: 'deleteApplicationReportDraft',
    status: HttpStatus.NO_CONTENT,
    include404: true,
    description:
      'Permanently deletes a DRAFT report and all data under it (employees, criteria tree, assignments, outlier groups). Hard delete — nothing is retained. 404 if the draft is not owned by the company or has already been submitted (submitted reports are withdrawn via DELETE /application/reports/:providerId instead).',
  })
  async deleteDraft(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<void> {
    return this.reportDraftService.deleteDraft(providerId, company)
  }

  @Post('reports/:providerId/draft/submit')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      'Upstream island.is application UUID (provider_id) of the draft.',
  })
  @DoeResponse({
    operationId: 'submitApplicationReportDraft',
    status: 201,
    include404: true,
    type: CreateReportResponseDto,
    description:
      'Finalises a DRAFT (DRAFT → SUBMITTED, or POSTPONED when a salary report\'s outliers are acknowledged but not yet explained). Freezes derived scores + the result snapshot, creates the company_report snapshot from the payload (parent + subsidiaries), and makes the report visible to reviewers. For salary reports, equalityReportId is required and must reference an APPROVED equality report.',
  })
  async submitDraft(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: SubmitDraftDto,
  ): Promise<CreateReportResponseDto> {
    return this.reportDraftSubmitService.submitDraft(providerId, company, input)
  }

  @Post('reports/:providerId/draft/import')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      'Upstream island.is application UUID (provider_id) of the draft.',
  })
  @DoeResponse({
    operationId: 'importApplicationReportDraftWorkbook',
    include404: true,
    type: DraftDetailDto,
    description:
      'Bulk-populates a SALARY draft from an uploaded workbook. Presign + upload via POST /application/reports/excel/presign, then pass the object { key } here. REPLACE semantics — the draft\'s existing scoring content is cleared and replaced by the workbook (scores stay NULL until submit). Returns the refreshed draft detail. 400 on an equality draft or a malformed workbook.',
  })
  async importDraftWorkbook(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() body: ImportKeyDto,
  ): Promise<DraftDetailDto> {
    return this.reportDraftSeedService.seedFromWorkbook(
      providerId,
      company,
      body.key,
    )
  }

  // ── Bulk sync ──────────────────────────────────────────────────────────

  @Post('reports/:providerId/draft/sync')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({
    name: 'providerId',
    type: String,
    description:
      'Upstream island.is application UUID (provider_id) of the draft.',
  })
  @DoeResponse({
    operationId: 'syncApplicationReportDraft',
    status: HttpStatus.NO_CONTENT,
    include404: true,
    description:
      'Applies a batch of create/update/remove commands to the draft\'s content (criteria tree, roles, employees, outlier groups) in one atomic transaction — the single write path for the portal, flushed once per screen navigate. Ids are client-minted UUIDs, so a command may reference a sibling created in the same batch; a repeated CREATE is an idempotent upsert. Omitted collections are untouched; an empty array is a no-op. At most 1000 employee commands per call. 204 on success (the portal refetches the affected reads); 404 if the draft is not owned or already submitted; 400/409 on a malformed or referentially-inconsistent batch (the whole batch rolls back).',
  })
  async syncDraft(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: SyncDraftDto,
  ): Promise<void> {
    return this.reportDraftSyncService.syncDraft(providerId, company, input)
  }

  @Get('reports/:providerId/draft/analysis')
  @ApiParam({ name: 'providerId', type: String })
  @DoeResponse({
    operationId: 'getApplicationDraftAnalysis',
    include404: true,
    type: SalaryAnalysisResponseDto,
    description:
      'Derived salary-analysis preview for a SALARY draft: outliers + the gender/score chart, computed on the fly from the draft\'s current scoring graph (employee scores are not yet persisted). 400 on an equality draft.',
  })
  async getDraftAnalysis(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<SalaryAnalysisResponseDto> {
    return this.reportDraftAnalysisService.analyzeDraft(providerId, company)
  }

  // ── Reads: roles ─────────────────────────────────────────────────────────

  @Get('reports/:providerId/draft/roles')
  @ApiParam({ name: 'providerId', type: String })
  @DoeResponse({
    operationId: 'listApplicationDraftRoles',
    include404: true,
    type: GetDraftRolesResponseDto,
    description: 'Lists the employee roles defined on a draft (by title).',
  })
  async listRoles(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<GetDraftRolesResponseDto> {
    const roles = await this.reportDraftRoleService.listRoles(
      providerId,
      company,
    )
    return { roles }
  }

  // ── Reads: employees ───────────────────────────────────────────────────

  @Get('reports/:providerId/draft/employees')
  @ApiParam({ name: 'providerId', type: String })
  @DoeResponse({
    operationId: 'listApplicationDraftEmployees',
    include404: true,
    type: GetDraftEmployeesResponseDto,
    description:
      'Paginated list of the draft\'s employees, ordered by ordinal. Scores are NULL until the report is submitted.',
  })
  async listEmployees(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
    @Query() query: PagingQuery,
  ): Promise<GetDraftEmployeesResponseDto> {
    return this.reportDraftEmployeeService.listEmployees(
      providerId,
      company,
      query,
    )
  }

  // ── Reads: criteria ──────────────────────────────────────────────────────

  @Get('reports/:providerId/draft/criteria')
  @ApiParam({ name: 'providerId', type: String })
  @DoeResponse({
    operationId: 'listApplicationDraftCriteria',
    include404: true,
    type: GetDraftCriteriaResponseDto,
    description:
      'Lists the top-level criteria of a draft. Sub-criteria and steps are fetched via their own endpoints.',
  })
  async listCriteria(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<GetDraftCriteriaResponseDto> {
    const criteria = await this.reportDraftCriterionService.listCriteria(
      providerId,
      company,
    )
    return { criteria }
  }

  // ── Reads: sub-criteria ──────────────────────────────────────────────────

  @Get('reports/:providerId/draft/criteria/:criterionId/sub-criteria')
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'criterionId', type: String })
  @DoeResponse({
    operationId: 'listApplicationDraftSubCriteria',
    include404: true,
    type: GetDraftSubCriteriaResponseDto,
    description: 'Lists the sub-criteria of one criterion on a draft.',
  })
  async listSubCriteria(
    @Param('providerId') providerId: string,
    @Param('criterionId') criterionId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<GetDraftSubCriteriaResponseDto> {
    const subCriteria =
      await this.reportDraftSubCriterionService.listSubCriteria(
        providerId,
        company,
        criterionId,
      )
    return { subCriteria }
  }

  // ── Reads: steps ─────────────────────────────────────────────────────────

  @Get('reports/:providerId/draft/sub-criteria/:subCriterionId/steps')
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'subCriterionId', type: String })
  @DoeResponse({
    operationId: 'listApplicationDraftSteps',
    include404: true,
    type: GetDraftStepsResponseDto,
    description: 'Lists the scoring steps of one sub-criterion on a draft.',
  })
  async listSteps(
    @Param('providerId') providerId: string,
    @Param('subCriterionId') subCriterionId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<GetDraftStepsResponseDto> {
    const steps = await this.reportDraftStepService.listSteps(
      providerId,
      company,
      subCriterionId,
    )
    return { steps }
  }

  // ── Reads: step assignments ────────────────────────────────────────────

  @Get('reports/:providerId/draft/roles/:roleId/steps')
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'roleId', type: String })
  @DoeResponse({
    operationId: 'getApplicationDraftRoleSteps',
    include404: true,
    type: DraftAssignmentDto,
    description: 'Lists the step ids assigned to a role on a draft.',
  })
  async getRoleSteps(
    @Param('providerId') providerId: string,
    @Param('roleId') roleId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<DraftAssignmentDto> {
    return this.reportDraftAssignmentService.getRoleSteps(
      providerId,
      company,
      roleId,
    )
  }

  @Get('reports/:providerId/draft/employees/:employeeId/steps')
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'employeeId', type: String })
  @DoeResponse({
    operationId: 'getApplicationDraftEmployeeSteps',
    include404: true,
    type: DraftAssignmentDto,
    description:
      'Lists the personal step ids assigned to an employee on a draft.',
  })
  async getEmployeeSteps(
    @Param('providerId') providerId: string,
    @Param('employeeId') employeeId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<DraftAssignmentDto> {
    return this.reportDraftAssignmentService.getEmployeeSteps(
      providerId,
      company,
      employeeId,
    )
  }

  // ── Reads: outlier groups ──────────────────────────────────────────────

  @Get('reports/:providerId/draft/outlier-groups')
  @ApiParam({ name: 'providerId', type: String })
  @DoeResponse({
    operationId: 'listApplicationDraftOutlierGroups',
    include404: true,
    type: GetDraftOutlierGroupsResponseDto,
    description:
      'Lists the outlier groups on a draft, each with the ids of its member employees.',
  })
  async listOutlierGroups(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<GetDraftOutlierGroupsResponseDto> {
    const groups = await this.reportDraftOutlierGroupService.listGroups(
      providerId,
      company,
    )
    return { groups }
  }

  @Get('reports/:providerId/draft/employees/:employeeId/outlier-group')
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'employeeId', type: String })
  @DoeResponse({
    operationId: 'getApplicationDraftEmployeeOutlierGroup',
    include404: true,
    type: EmployeeOutlierGroupDto,
    description:
      "Returns the employee's current outlier-group membership (groupId null if unassigned).",
  })
  async getEmployeeOutlierGroup(
    @Param('providerId') providerId: string,
    @Param('employeeId') employeeId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<EmployeeOutlierGroupDto> {
    return this.reportDraftOutlierGroupService.getEmployeeGroup(
      providerId,
      company,
      employeeId,
    )
  }
}
