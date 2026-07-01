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
  Put,
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
import { ReportProviderEnum } from '../report/models/report.enums'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { ReportCriterionDto } from '../report-criterion/dto/report-criterion.dto'
import { ReportSubCriterionDto } from '../report-criterion/dto/report-sub-criterion.dto'
import { ReportSubCriterionStepDto } from '../report-criterion/dto/report-sub-criterion-step.dto'
import { ReportEmployeeDto } from '../report-employee/dto/report-employee.dto'
import { ReportEmployeeRoleDto } from '../report-employee/dto/report-employee-role.dto'
import { ReportOutlierGroupDto } from '../report-employee/dto/report-outlier-group.dto'
import { IReportDraftAnalysisService } from './analysis/report-draft-analysis.service.interface'
import { DraftAssignmentDto } from './assignment/dto/draft-assignment.dto'
import { SetStepsDto } from './assignment/dto/set-steps.dto'
import { IReportDraftAssignmentService } from './assignment/report-draft-assignment.service.interface'
import { CreateCriterionDto } from './criterion/dto/create-criterion.dto'
import { GetDraftCriteriaResponseDto } from './criterion/dto/get-draft-criteria-response.dto'
import { UpdateCriterionDto } from './criterion/dto/update-criterion.dto'
import { IReportDraftCriterionService } from './criterion/report-draft-criterion.service.interface'
import { CreateDraftReportDto } from './draft/dto/create-draft-report.dto'
import { DraftDetailDto } from './draft/dto/draft-detail.dto'
import { UpdateDraftDto } from './draft/dto/update-draft.dto'
import { IReportDraftService } from './draft/report-draft.service.interface'
import { CreateDraftEmployeeDto } from './employee/dto/create-draft-employee.dto'
import { GetDraftEmployeesResponseDto } from './employee/dto/get-draft-employees-response.dto'
import { UpdateDraftEmployeeDto } from './employee/dto/update-draft-employee.dto'
import { IReportDraftEmployeeService } from './employee/report-draft-employee.service.interface'
import { CreateOutlierGroupDto } from './outlier-group/dto/create-outlier-group.dto'
import { EmployeeOutlierGroupDto } from './outlier-group/dto/employee-outlier-group.dto'
import { GetDraftOutlierGroupsResponseDto } from './outlier-group/dto/get-draft-outlier-groups-response.dto'
import { SetEmployeeOutlierGroupDto } from './outlier-group/dto/set-employee-outlier-group.dto'
import { UpdateOutlierGroupDto } from './outlier-group/dto/update-outlier-group.dto'
import { IReportDraftOutlierGroupService } from './outlier-group/report-draft-outlier-group.service.interface'
import { CreateRoleDto } from './role/dto/create-role.dto'
import { GetDraftRolesResponseDto } from './role/dto/get-draft-roles-response.dto'
import { UpdateRoleDto } from './role/dto/update-role.dto'
import { IReportDraftRoleService } from './role/report-draft-role.service.interface'
import { CreateStepDto } from './step/dto/create-step.dto'
import { GetDraftStepsResponseDto } from './step/dto/get-draft-steps-response.dto'
import { UpdateStepDto } from './step/dto/update-step.dto'
import { IReportDraftStepService } from './step/report-draft-step.service.interface'
import { CreateSubCriterionDto } from './sub-criterion/dto/create-sub-criterion.dto'
import { GetDraftSubCriteriaResponseDto } from './sub-criterion/dto/get-draft-sub-criteria-response.dto'
import { UpdateSubCriterionDto } from './sub-criterion/dto/update-sub-criterion.dto'
import { IReportDraftSubCriterionService } from './sub-criterion/report-draft-sub-criterion.service.interface'
import { SubmitDraftDto } from './submit/dto/submit-draft.dto'
import { IReportDraftSubmitService } from './submit/report-draft-submit.service.interface'

/**
 * Applicant-facing draft surface bound to the island.is application portal.
 * Shares the company-auth boundary (`CompanyResourceGuard` + `CurrentCompany`)
 * with `ApplicationController`; the draft lifecycle (create → CRUD → submit →
 * delete) lives here so the application controller stays thin.
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
  ) {}

  @Post('reports/draft')
  @HttpCode(HttpStatus.CREATED)
  @AutoProvisionCompany()
  @DoeResponse({
    operationId: 'createApplicationReportDraft',
    status: 201,
    type: CreateReportResponseDto,
    description:
      'Opens a DRAFT report at "initial contact" (the applicant leaving the prerequisites step upstream). The report is invisible to reviewers until submitted; the portal builds it up via the report-draft CRUD endpoints. Idempotent on the upstream (provider_type, provider_id) tuple — a retried call returns the existing draft. Auto-provisions the company on first contact.',
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

  // ── Roles ──────────────────────────────────────────────────────────────

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

  @Post('reports/:providerId/draft/roles')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'providerId', type: String })
  @DoeResponse({
    operationId: 'createApplicationDraftRole',
    status: 201,
    include404: true,
    type: ReportEmployeeRoleDto,
    description: 'Creates an employee role on a draft.',
  })
  async createRole(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: CreateRoleDto,
  ): Promise<ReportEmployeeRoleDto> {
    return this.reportDraftRoleService.createRole(providerId, company, input)
  }

  @Patch('reports/:providerId/draft/roles/:roleId')
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'roleId', type: String })
  @DoeResponse({
    operationId: 'updateApplicationDraftRole',
    include404: true,
    type: ReportEmployeeRoleDto,
    description: 'Renames an employee role on a draft.',
  })
  async updateRole(
    @Param('providerId') providerId: string,
    @Param('roleId') roleId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: UpdateRoleDto,
  ): Promise<ReportEmployeeRoleDto> {
    return this.reportDraftRoleService.updateRole(
      providerId,
      company,
      roleId,
      input,
    )
  }

  @Delete('reports/:providerId/draft/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'roleId', type: String })
  @DoeResponse({
    operationId: 'deleteApplicationDraftRole',
    status: HttpStatus.NO_CONTENT,
    include404: true,
    description:
      'Deletes an employee role from a draft. 409 if any employee is still assigned to it.',
  })
  async deleteRole(
    @Param('providerId') providerId: string,
    @Param('roleId') roleId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<void> {
    return this.reportDraftRoleService.deleteRole(providerId, company, roleId)
  }

  // ── Employees ──────────────────────────────────────────────────────────

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

  @Post('reports/:providerId/draft/employees')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'providerId', type: String })
  @DoeResponse({
    operationId: 'createApplicationDraftEmployee',
    status: 201,
    include404: true,
    type: ReportEmployeeDto,
    description:
      'Adds one employee to a draft. Ordinal is assigned server-side; score stays NULL until submit. The role must already exist on the draft (400 otherwise).',
  })
  async createEmployee(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: CreateDraftEmployeeDto,
  ): Promise<ReportEmployeeDto> {
    return this.reportDraftEmployeeService.createEmployee(
      providerId,
      company,
      input,
    )
  }

  @Patch('reports/:providerId/draft/employees/:employeeId')
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'employeeId', type: String })
  @DoeResponse({
    operationId: 'updateApplicationDraftEmployee',
    include404: true,
    type: ReportEmployeeDto,
    description:
      'Patches one draft employee (PATCH semantics). A supplied reportEmployeeRoleId must belong to the same draft (400 otherwise).',
  })
  async updateEmployee(
    @Param('providerId') providerId: string,
    @Param('employeeId') employeeId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: UpdateDraftEmployeeDto,
  ): Promise<ReportEmployeeDto> {
    return this.reportDraftEmployeeService.updateEmployee(
      providerId,
      company,
      employeeId,
      input,
    )
  }

  @Delete('reports/:providerId/draft/employees/:employeeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'employeeId', type: String })
  @DoeResponse({
    operationId: 'deleteApplicationDraftEmployee',
    status: HttpStatus.NO_CONTENT,
    include404: true,
    description: 'Removes one employee from a draft.',
  })
  async deleteEmployee(
    @Param('providerId') providerId: string,
    @Param('employeeId') employeeId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<void> {
    return this.reportDraftEmployeeService.deleteEmployee(
      providerId,
      company,
      employeeId,
    )
  }

  // ── Criteria ───────────────────────────────────────────────────────────

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

  @Post('reports/:providerId/draft/criteria')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'providerId', type: String })
  @DoeResponse({
    operationId: 'createApplicationDraftCriterion',
    status: 201,
    include404: true,
    type: ReportCriterionDto,
    description: 'Creates a top-level criterion on a draft.',
  })
  async createCriterion(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: CreateCriterionDto,
  ): Promise<ReportCriterionDto> {
    return this.reportDraftCriterionService.createCriterion(
      providerId,
      company,
      input,
    )
  }

  @Patch('reports/:providerId/draft/criteria/:criterionId')
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'criterionId', type: String })
  @DoeResponse({
    operationId: 'updateApplicationDraftCriterion',
    include404: true,
    type: ReportCriterionDto,
    description: 'Patches a criterion on a draft (PATCH semantics).',
  })
  async updateCriterion(
    @Param('providerId') providerId: string,
    @Param('criterionId') criterionId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: UpdateCriterionDto,
  ): Promise<ReportCriterionDto> {
    return this.reportDraftCriterionService.updateCriterion(
      providerId,
      company,
      criterionId,
      input,
    )
  }

  @Delete('reports/:providerId/draft/criteria/:criterionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'criterionId', type: String })
  @DoeResponse({
    operationId: 'deleteApplicationDraftCriterion',
    status: HttpStatus.NO_CONTENT,
    include404: true,
    description:
      'Deletes a criterion and its entire subtree (sub-criteria, steps, and the role/employee assignments pointing at those steps).',
  })
  async deleteCriterion(
    @Param('providerId') providerId: string,
    @Param('criterionId') criterionId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<void> {
    return this.reportDraftCriterionService.deleteCriterion(
      providerId,
      company,
      criterionId,
    )
  }

  // ── Sub-criteria ───────────────────────────────────────────────────────

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

  @Post('reports/:providerId/draft/criteria/:criterionId/sub-criteria')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'criterionId', type: String })
  @DoeResponse({
    operationId: 'createApplicationDraftSubCriterion',
    status: 201,
    include404: true,
    type: ReportSubCriterionDto,
    description: 'Creates a sub-criterion under a criterion on a draft.',
  })
  async createSubCriterion(
    @Param('providerId') providerId: string,
    @Param('criterionId') criterionId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: CreateSubCriterionDto,
  ): Promise<ReportSubCriterionDto> {
    return this.reportDraftSubCriterionService.createSubCriterion(
      providerId,
      company,
      criterionId,
      input,
    )
  }

  @Patch(
    'reports/:providerId/draft/criteria/:criterionId/sub-criteria/:subCriterionId',
  )
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'criterionId', type: String })
  @ApiParam({ name: 'subCriterionId', type: String })
  @DoeResponse({
    operationId: 'updateApplicationDraftSubCriterion',
    include404: true,
    type: ReportSubCriterionDto,
    description: 'Patches a sub-criterion on a draft (PATCH semantics).',
  })
  async updateSubCriterion(
    @Param('providerId') providerId: string,
    @Param('criterionId') criterionId: string,
    @Param('subCriterionId') subCriterionId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: UpdateSubCriterionDto,
  ): Promise<ReportSubCriterionDto> {
    return this.reportDraftSubCriterionService.updateSubCriterion(
      providerId,
      company,
      criterionId,
      subCriterionId,
      input,
    )
  }

  @Delete(
    'reports/:providerId/draft/criteria/:criterionId/sub-criteria/:subCriterionId',
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'criterionId', type: String })
  @ApiParam({ name: 'subCriterionId', type: String })
  @DoeResponse({
    operationId: 'deleteApplicationDraftSubCriterion',
    status: HttpStatus.NO_CONTENT,
    include404: true,
    description:
      'Deletes a sub-criterion and its steps (and the role/employee assignments pointing at those steps).',
  })
  async deleteSubCriterion(
    @Param('providerId') providerId: string,
    @Param('criterionId') criterionId: string,
    @Param('subCriterionId') subCriterionId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<void> {
    return this.reportDraftSubCriterionService.deleteSubCriterion(
      providerId,
      company,
      criterionId,
      subCriterionId,
    )
  }

  // ── Steps ──────────────────────────────────────────────────────────────

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

  @Post('reports/:providerId/draft/sub-criteria/:subCriterionId/steps')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'subCriterionId', type: String })
  @DoeResponse({
    operationId: 'createApplicationDraftStep',
    status: 201,
    include404: true,
    type: ReportSubCriterionStepDto,
    description: 'Creates a scoring step under a sub-criterion on a draft.',
  })
  async createStep(
    @Param('providerId') providerId: string,
    @Param('subCriterionId') subCriterionId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: CreateStepDto,
  ): Promise<ReportSubCriterionStepDto> {
    return this.reportDraftStepService.createStep(
      providerId,
      company,
      subCriterionId,
      input,
    )
  }

  @Patch('reports/:providerId/draft/sub-criteria/:subCriterionId/steps/:stepId')
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'subCriterionId', type: String })
  @ApiParam({ name: 'stepId', type: String })
  @DoeResponse({
    operationId: 'updateApplicationDraftStep',
    include404: true,
    type: ReportSubCriterionStepDto,
    description: 'Patches a scoring step on a draft (PATCH semantics).',
  })
  async updateStep(
    @Param('providerId') providerId: string,
    @Param('subCriterionId') subCriterionId: string,
    @Param('stepId') stepId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: UpdateStepDto,
  ): Promise<ReportSubCriterionStepDto> {
    return this.reportDraftStepService.updateStep(
      providerId,
      company,
      subCriterionId,
      stepId,
      input,
    )
  }

  @Delete(
    'reports/:providerId/draft/sub-criteria/:subCriterionId/steps/:stepId',
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'subCriterionId', type: String })
  @ApiParam({ name: 'stepId', type: String })
  @DoeResponse({
    operationId: 'deleteApplicationDraftStep',
    status: HttpStatus.NO_CONTENT,
    include404: true,
    description:
      'Deletes a scoring step and the role/employee assignments pointing at it.',
  })
  async deleteStep(
    @Param('providerId') providerId: string,
    @Param('subCriterionId') subCriterionId: string,
    @Param('stepId') stepId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<void> {
    return this.reportDraftStepService.deleteStep(
      providerId,
      company,
      subCriterionId,
      stepId,
    )
  }

  // ── Step assignments (replace-per-owner) ───────────────────────────────

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

  @Put('reports/:providerId/draft/roles/:roleId/steps')
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'roleId', type: String })
  @DoeResponse({
    operationId: 'setApplicationDraftRoleSteps',
    include404: true,
    type: DraftAssignmentDto,
    description:
      'Replaces the full set of steps assigned to a role on a draft. Every step id must belong to the same draft (400 otherwise).',
  })
  async setRoleSteps(
    @Param('providerId') providerId: string,
    @Param('roleId') roleId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: SetStepsDto,
  ): Promise<DraftAssignmentDto> {
    return this.reportDraftAssignmentService.setRoleSteps(
      providerId,
      company,
      roleId,
      input,
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

  @Put('reports/:providerId/draft/employees/:employeeId/steps')
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'employeeId', type: String })
  @DoeResponse({
    operationId: 'setApplicationDraftEmployeeSteps',
    include404: true,
    type: DraftAssignmentDto,
    description:
      'Replaces the full set of personal steps assigned to an employee on a draft. Every step id must belong to the same draft (400 otherwise).',
  })
  async setEmployeeSteps(
    @Param('providerId') providerId: string,
    @Param('employeeId') employeeId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: SetStepsDto,
  ): Promise<DraftAssignmentDto> {
    return this.reportDraftAssignmentService.setEmployeeSteps(
      providerId,
      company,
      employeeId,
      input,
    )
  }

  // ── Outlier groups ─────────────────────────────────────────────────────

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

  @Post('reports/:providerId/draft/outlier-groups')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'providerId', type: String })
  @DoeResponse({
    operationId: 'createApplicationDraftOutlierGroup',
    status: 201,
    include404: true,
    type: ReportOutlierGroupDto,
    description:
      'Creates an outlier group on a draft. The four explanation fields are all-or-none (400 if partially provided).',
  })
  async createOutlierGroup(
    @Param('providerId') providerId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: CreateOutlierGroupDto,
  ): Promise<ReportOutlierGroupDto> {
    return this.reportDraftOutlierGroupService.createGroup(
      providerId,
      company,
      input,
    )
  }

  @Patch('reports/:providerId/draft/outlier-groups/:groupId')
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'groupId', type: String })
  @DoeResponse({
    operationId: 'updateApplicationDraftOutlierGroup',
    include404: true,
    type: ReportOutlierGroupDto,
    description:
      'Patches an outlier group on a draft (PATCH semantics; explanation fields are all-or-none when touched).',
  })
  async updateOutlierGroup(
    @Param('providerId') providerId: string,
    @Param('groupId') groupId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: UpdateOutlierGroupDto,
  ): Promise<ReportOutlierGroupDto> {
    return this.reportDraftOutlierGroupService.updateGroup(
      providerId,
      company,
      groupId,
      input,
    )
  }

  @Delete('reports/:providerId/draft/outlier-groups/:groupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'groupId', type: String })
  @DoeResponse({
    operationId: 'deleteApplicationDraftOutlierGroup',
    status: HttpStatus.NO_CONTENT,
    include404: true,
    description:
      'Deletes an outlier group. 409 if any employee is still assigned to it.',
  })
  async deleteOutlierGroup(
    @Param('providerId') providerId: string,
    @Param('groupId') groupId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<void> {
    return this.reportDraftOutlierGroupService.deleteGroup(
      providerId,
      company,
      groupId,
    )
  }

  // ── Outlier-group membership (per employee) ────────────────────────────

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

  @Put('reports/:providerId/draft/employees/:employeeId/outlier-group')
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'employeeId', type: String })
  @DoeResponse({
    operationId: 'setApplicationDraftEmployeeOutlierGroup',
    include404: true,
    type: EmployeeOutlierGroupDto,
    description:
      'Assigns a detected-outlier employee to an outlier group on the same draft. 400 if the employee is not currently a detected outlier.',
  })
  async setEmployeeOutlierGroup(
    @Param('providerId') providerId: string,
    @Param('employeeId') employeeId: string,
    @CurrentCompany() company: CompanyDto,
    @Body() input: SetEmployeeOutlierGroupDto,
  ): Promise<EmployeeOutlierGroupDto> {
    return this.reportDraftOutlierGroupService.setEmployeeGroup(
      providerId,
      company,
      employeeId,
      input,
    )
  }

  @Delete('reports/:providerId/draft/employees/:employeeId/outlier-group')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'providerId', type: String })
  @ApiParam({ name: 'employeeId', type: String })
  @DoeResponse({
    operationId: 'clearApplicationDraftEmployeeOutlierGroup',
    status: HttpStatus.NO_CONTENT,
    include404: true,
    description: "Removes the employee's outlier-group membership.",
  })
  async clearEmployeeOutlierGroup(
    @Param('providerId') providerId: string,
    @Param('employeeId') employeeId: string,
    @CurrentCompany() company: CompanyDto,
  ): Promise<void> {
    return this.reportDraftOutlierGroupService.clearEmployeeGroup(
      providerId,
      company,
      employeeId,
    )
  }
}
