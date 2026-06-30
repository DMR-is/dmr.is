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
import { CompanyDto } from '../company/dto/company.dto'
import { ReportProviderEnum } from '../report/models/report.enums'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { ReportCriterionDto } from '../report-criterion/dto/report-criterion.dto'
import { ReportSubCriterionDto } from '../report-criterion/dto/report-sub-criterion.dto'
import { ReportSubCriterionStepDto } from '../report-criterion/dto/report-sub-criterion-step.dto'
import { ReportEmployeeDto } from '../report-employee/dto/report-employee.dto'
import { ReportEmployeeRoleDto } from '../report-employee/dto/report-employee-role.dto'
import { CreateCriterionDto } from './dto/create-criterion.dto'
import { CreateDraftEmployeeDto } from './dto/create-draft-employee.dto'
import { CreateDraftReportDto } from './dto/create-draft-report.dto'
import { CreateRoleDto } from './dto/create-role.dto'
import { CreateStepDto } from './dto/create-step.dto'
import { CreateSubCriterionDto } from './dto/create-sub-criterion.dto'
import { DraftDetailDto } from './dto/draft-detail.dto'
import { GetDraftCriteriaResponseDto } from './dto/get-draft-criteria-response.dto'
import { GetDraftEmployeesResponseDto } from './dto/get-draft-employees-response.dto'
import { GetDraftRolesResponseDto } from './dto/get-draft-roles-response.dto'
import { GetDraftStepsResponseDto } from './dto/get-draft-steps-response.dto'
import { GetDraftSubCriteriaResponseDto } from './dto/get-draft-sub-criteria-response.dto'
import { UpdateCriterionDto } from './dto/update-criterion.dto'
import { UpdateDraftDto } from './dto/update-draft.dto'
import { UpdateDraftEmployeeDto } from './dto/update-draft-employee.dto'
import { UpdateRoleDto } from './dto/update-role.dto'
import { UpdateStepDto } from './dto/update-step.dto'
import { UpdateSubCriterionDto } from './dto/update-sub-criterion.dto'
import { IReportDraftService } from './report-draft.service.interface'
import { IReportDraftCriterionService } from './report-draft-criterion.service.interface'
import { IReportDraftEmployeeService } from './report-draft-employee.service.interface'
import { IReportDraftRoleService } from './report-draft-role.service.interface'
import { IReportDraftStepService } from './report-draft-step.service.interface'
import { IReportDraftSubCriterionService } from './report-draft-sub-criterion.service.interface'

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
}
