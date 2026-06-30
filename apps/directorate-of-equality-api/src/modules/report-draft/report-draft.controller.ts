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
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AutoProvisionCompany } from '../../core/decorators/auto-provision-company.decorator'
import { CurrentCompany } from '../../core/decorators/current-company.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { CompanyDto } from '../company/dto/company.dto'
import { ReportProviderEnum } from '../report/models/report.enums'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { ReportEmployeeRoleDto } from '../report-employee/dto/report-employee-role.dto'
import { CreateDraftReportDto } from './dto/create-draft-report.dto'
import { CreateRoleDto } from './dto/create-role.dto'
import { DraftDetailDto } from './dto/draft-detail.dto'
import { GetDraftRolesResponseDto } from './dto/get-draft-roles-response.dto'
import { UpdateDraftDto } from './dto/update-draft.dto'
import { UpdateRoleDto } from './dto/update-role.dto'
import { IReportDraftService } from './report-draft.service.interface'
import { IReportDraftRoleService } from './report-draft-role.service.interface'

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
}
