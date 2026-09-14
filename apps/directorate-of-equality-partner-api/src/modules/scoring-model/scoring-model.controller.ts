import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger'

import { CompanyDto } from '@dmr.is/doe-modules/company'
import {
  CreateScoringCriterionDto,
  CreateScoringModelDto,
  CreateScoringRoleDto,
  CreateScoringSubCriterionDto,
  GetScoringModelsResponseDto,
  IScoringModelService,
  ScoringModelDto,
  ScoringModelSummaryDto,
  SetScoringRoleStepAssignmentsDto,
  SetScoringStepsDto,
  UpdateScoringCriterionDto,
  UpdateScoringRoleDto,
  UpdateScoringSubCriterionDto,
} from '@dmr.is/doe-modules/scoring-model'
import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

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
 * The company's scoring model (starfsmat), authored once and referenced by a
 * filing rather than re-sent with every submission.
 *
 * **Writes succeed even when they leave the model incomplete.** A model is built
 * over many calls and its weights do not reach 100 until the last sub-criterion
 * is in; refusing every intermediate state would make it impossible to author
 * one. So every response — reads included — carries `validation`, saying whether
 * the model is fit to file and, when it is not, every reason at once. The
 * refusal happens at filing, against the same rules.
 *
 * `validation.status: VALID` means the *model* is complete. It is not a promise
 * that the next filing succeeds: two of the submission's rules need the filing's
 * employees (the minimum population, and one personal assignment per employee)
 * and cannot be decided here.
 *
 * Guard order is the same as the rest of the partner surface, for the same
 * reasons — see `PartnerController`.
 *
 * `@RequireActiveCompany` covers this surface too. A company that has fallen
 * off Jafnréttisstofa's register gets one answer everywhere, and authoring a
 * starfsmat it cannot file against is exactly the half-working surface that
 * decision rejected.
 */
@Controller({
  path: 'partner/scoring-models',
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
export class ScoringModelController {
  constructor(
    @Inject(IScoringModelService)
    private readonly scoringModelService: IScoringModelService,
  ) {}

  @Post()
  @RequireApiScope(ApiKeyScopeEnum.SCORING_WRITE)
  @PartnerResponse({
    operationId: 'createScoringModel',
    type: ScoringModelSummaryDto,
    description:
      'Creates an empty scoring model for the company this key belongs to. It starts invalid — no criteria, no weights — and becomes fit to file as criteria and sub-criteria are added. Read it back, or make any write, to see what is still missing.',
  })
  createModel(
    @CurrentCompany() company: CompanyDto,
    @Body() body: CreateScoringModelDto,
  ): Promise<ScoringModelSummaryDto> {
    return this.scoringModelService.createModel(company, body)
  }

  @Get()
  @RequireApiScope(ApiKeyScopeEnum.REPORT_READ)
  @PartnerResponse({
    operationId: 'getScoringModels',
    type: GetScoringModelsResponseDto,
    description:
      'Every scoring model belonging to the company this key points at. Summaries only — fetch one by id for its tree and validity.',
  })
  listModels(
    @CurrentCompany() company: CompanyDto,
  ): Promise<GetScoringModelsResponseDto> {
    return this.scoringModelService.listModels(company)
  }

  @Get(':modelId')
  @RequireApiScope(ApiKeyScopeEnum.REPORT_READ)
  @ApiParam({ name: 'modelId', type: String, format: 'uuid' })
  @PartnerResponse({
    operationId: 'getScoringModel',
    type: ScoringModelDto,
    description:
      'The whole model: every criterion with its sub-criteria and their steps, every role with its step assignments, and the model’s current validity. A criterion’s `weight` is derived — the sum of its own sub-criteria — and is not stored or accepted on write.',
  })
  getModel(
    @CurrentCompany() company: CompanyDto,
    @Param('modelId', ParseUUIDPipe) modelId: string,
  ): Promise<ScoringModelDto> {
    return this.scoringModelService.getModel(company, modelId)
  }

  @Delete(':modelId')
  @RequireApiScope(ApiKeyScopeEnum.SCORING_WRITE)
  @ApiParam({ name: 'modelId', type: String, format: 'uuid' })
  @PartnerResponse({
    operationId: 'deleteScoringModel',
    successDescription:
      'Deleted, along with its criteria, sub-criteria, steps and roles. Reports already filed against it are unaffected — a filing snapshots the model it was scored under.',
  })
  async deleteModel(
    @CurrentCompany() company: CompanyDto,
    @Param('modelId', ParseUUIDPipe) modelId: string,
  ): Promise<void> {
    await this.scoringModelService.deleteModel(company, modelId)
  }

  @Post(':modelId/criteria')
  @RequireApiScope(ApiKeyScopeEnum.SCORING_WRITE)
  @ApiParam({ name: 'modelId', type: String, format: 'uuid' })
  @PartnerResponse({
    operationId: 'createScoringCriterion',
    type: ScoringModelDto,
    description:
      'Adds a criterion (viðmið). `title` and `description` are yours to choose — the catalog at `GET /partner/sub-criteria/catalog` is a set of examples, not a list to pick from. `type` is constrained: a model needs at least one criterion of each of the four job-based types and at most one PERSONAL, and nothing stops two of the same type. Returns the whole model so the new validity is visible immediately.',
  })
  createCriterion(
    @CurrentCompany() company: CompanyDto,
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Body() body: CreateScoringCriterionDto,
  ): Promise<ScoringModelDto> {
    return this.scoringModelService.createCriterion(company, modelId, body)
  }

  @Patch(':modelId/criteria/:criterionId')
  @RequireApiScope(ApiKeyScopeEnum.SCORING_WRITE)
  @ApiParam({ name: 'modelId', type: String, format: 'uuid' })
  @ApiParam({ name: 'criterionId', type: String, format: 'uuid' })
  @PartnerResponse({
    operationId: 'updateScoringCriterion',
    type: ScoringModelDto,
    description:
      'Patches a criterion. An omitted field is left alone, never cleared. Changing `type` can leave a mandatory type unfilled — that is allowed, and the response says so.',
  })
  updateCriterion(
    @CurrentCompany() company: CompanyDto,
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('criterionId', ParseUUIDPipe) criterionId: string,
    @Body() body: UpdateScoringCriterionDto,
  ): Promise<ScoringModelDto> {
    return this.scoringModelService.updateCriterion(
      company,
      modelId,
      criterionId,
      body,
    )
  }

  @Delete(':modelId/criteria/:criterionId')
  @RequireApiScope(ApiKeyScopeEnum.SCORING_WRITE)
  @ApiParam({ name: 'modelId', type: String, format: 'uuid' })
  @ApiParam({ name: 'criterionId', type: String, format: 'uuid' })
  @PartnerResponse({
    operationId: 'deleteScoringCriterion',
    type: ScoringModelDto,
    description:
      'Deletes a criterion and everything under it. Deleting one of the four mandatory types is permitted and leaves the model invalid until a criterion of that type exists again.',
  })
  deleteCriterion(
    @CurrentCompany() company: CompanyDto,
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('criterionId', ParseUUIDPipe) criterionId: string,
  ): Promise<ScoringModelDto> {
    return this.scoringModelService.deleteCriterion(
      company,
      modelId,
      criterionId,
    )
  }

  @Post(':modelId/criteria/:criterionId/sub-criteria')
  @RequireApiScope(ApiKeyScopeEnum.SCORING_WRITE)
  @ApiParam({ name: 'modelId', type: String, format: 'uuid' })
  @ApiParam({ name: 'criterionId', type: String, format: 'uuid' })
  @PartnerResponse({
    operationId: 'createScoringSubCriterion',
    type: ScoringModelDto,
    description:
      'Adds a sub-criterion (undirviðmið) under a criterion. `weight` is the only weight in the model that reaches a score: every sub-criterion weight across the whole model sums to 100, and a criterion’s weight is the sum of its own. Nested under the criterion so the parent is asserted rather than trusted.',
  })
  createSubCriterion(
    @CurrentCompany() company: CompanyDto,
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('criterionId', ParseUUIDPipe) criterionId: string,
    @Body() body: CreateScoringSubCriterionDto,
  ): Promise<ScoringModelDto> {
    return this.scoringModelService.createSubCriterion(
      company,
      modelId,
      criterionId,
      body,
    )
  }

  @Patch(':modelId/criteria/:criterionId/sub-criteria/:subCriterionId')
  @RequireApiScope(ApiKeyScopeEnum.SCORING_WRITE)
  @ApiParam({ name: 'modelId', type: String, format: 'uuid' })
  @ApiParam({ name: 'criterionId', type: String, format: 'uuid' })
  @ApiParam({ name: 'subCriterionId', type: String, format: 'uuid' })
  @PartnerResponse({
    operationId: 'updateScoringSubCriterion',
    type: ScoringModelDto,
    description:
      'Patches a sub-criterion. Re-weighting one will usually put the model’s total off 100 until the others are adjusted; that is expected, and `validation.reasons` carries the running total.',
  })
  updateSubCriterion(
    @CurrentCompany() company: CompanyDto,
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('criterionId', ParseUUIDPipe) criterionId: string,
    @Param('subCriterionId', ParseUUIDPipe) subCriterionId: string,
    @Body() body: UpdateScoringSubCriterionDto,
  ): Promise<ScoringModelDto> {
    return this.scoringModelService.updateSubCriterion(
      company,
      modelId,
      criterionId,
      subCriterionId,
      body,
    )
  }

  @Delete(':modelId/criteria/:criterionId/sub-criteria/:subCriterionId')
  @RequireApiScope(ApiKeyScopeEnum.SCORING_WRITE)
  @ApiParam({ name: 'modelId', type: String, format: 'uuid' })
  @ApiParam({ name: 'criterionId', type: String, format: 'uuid' })
  @ApiParam({ name: 'subCriterionId', type: String, format: 'uuid' })
  @PartnerResponse({
    operationId: 'deleteScoringSubCriterion',
    type: ScoringModelDto,
    description:
      'Deletes a sub-criterion and its steps. Any role assignment pointing at it goes with it.',
  })
  deleteSubCriterion(
    @CurrentCompany() company: CompanyDto,
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('criterionId', ParseUUIDPipe) criterionId: string,
    @Param('subCriterionId', ParseUUIDPipe) subCriterionId: string,
  ): Promise<ScoringModelDto> {
    return this.scoringModelService.deleteSubCriterion(
      company,
      modelId,
      criterionId,
      subCriterionId,
    )
  }

  @Put(':modelId/criteria/:criterionId/sub-criteria/:subCriterionId/steps')
  @RequireApiScope(ApiKeyScopeEnum.SCORING_WRITE)
  @ApiParam({ name: 'modelId', type: String, format: 'uuid' })
  @ApiParam({ name: 'criterionId', type: String, format: 'uuid' })
  @ApiParam({ name: 'subCriterionId', type: String, format: 'uuid' })
  @PartnerResponse({
    operationId: 'setScoringSubCriterionSteps',
    type: ScoringModelDto,
    description:
      'Replaces a sub-criterion’s whole scale (þrep). A `PUT` of the complete array rather than one step at a time: a þrep’s score is derived from its position over the scale’s length, so the orders must run 1..n with no gaps, and building them one call at a time would pass through states with no single call able to repair them. Position in the array is the þrep number — there is no order to send. Any role step assignment onto the old scale is dropped with it, and the model then reports that job as missing an assignment.',
  })
  setSteps(
    @CurrentCompany() company: CompanyDto,
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('criterionId', ParseUUIDPipe) criterionId: string,
    @Param('subCriterionId', ParseUUIDPipe) subCriterionId: string,
    @Body() body: SetScoringStepsDto,
  ): Promise<ScoringModelDto> {
    return this.scoringModelService.setSteps(
      company,
      modelId,
      criterionId,
      subCriterionId,
      body,
    )
  }

  @Post(':modelId/roles')
  @RequireApiScope(ApiKeyScopeEnum.SCORING_WRITE)
  @ApiParam({ name: 'modelId', type: String, format: 'uuid' })
  @PartnerResponse({
    operationId: 'createScoringRole',
    type: ScoringModelDto,
    description:
      'Adds a job (starf). A job owns the job-based criteria: its step assignments are what score every employee who holds it, so an employee never carries job-based þrep of their own — only personal ones. Newly created jobs have no assignments, which the model reports until they are set.',
  })
  createRole(
    @CurrentCompany() company: CompanyDto,
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Body() body: CreateScoringRoleDto,
  ): Promise<ScoringModelDto> {
    return this.scoringModelService.createRole(company, modelId, body)
  }

  @Patch(':modelId/roles/:roleId')
  @RequireApiScope(ApiKeyScopeEnum.SCORING_WRITE)
  @ApiParam({ name: 'modelId', type: String, format: 'uuid' })
  @ApiParam({ name: 'roleId', type: String, format: 'uuid' })
  @PartnerResponse({
    operationId: 'updateScoringRole',
    type: ScoringModelDto,
    description:
      'Renames a job. Its step assignments are untouched — they are held by id, not by title.',
  })
  updateRole(
    @CurrentCompany() company: CompanyDto,
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() body: UpdateScoringRoleDto,
  ): Promise<ScoringModelDto> {
    return this.scoringModelService.updateRole(company, modelId, roleId, body)
  }

  @Delete(':modelId/roles/:roleId')
  @RequireApiScope(ApiKeyScopeEnum.SCORING_WRITE)
  @ApiParam({ name: 'modelId', type: String, format: 'uuid' })
  @ApiParam({ name: 'roleId', type: String, format: 'uuid' })
  @PartnerResponse({
    operationId: 'deleteScoringRole',
    type: ScoringModelDto,
    description:
      'Deletes a job and its step assignments. A filing that names this job in an employee’s `roleTitle` will no longer resolve, so delete it only once no employee is mapped to it.',
  })
  deleteRole(
    @CurrentCompany() company: CompanyDto,
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<ScoringModelDto> {
    return this.scoringModelService.deleteRole(company, modelId, roleId)
  }

  @Put(':modelId/roles/:roleId/step-assignments')
  @RequireApiScope(ApiKeyScopeEnum.SCORING_WRITE)
  @ApiParam({ name: 'modelId', type: String, format: 'uuid' })
  @ApiParam({ name: 'roleId', type: String, format: 'uuid' })
  @PartnerResponse({
    operationId: 'setScoringRoleStepAssignments',
    type: ScoringModelDto,
    description:
      'Replaces a job’s whole set of step assignments — one þrep per job-based sub-criterion. Sent whole rather than one at a time because exactly one assignment per job per sub-criterion is a constraint the table itself holds, so a partial write cannot move a job from one þrep to another without deleting first. An incomplete set is accepted and reported like any other incompleteness; an incoherent one is refused with a 400: a step belonging to a different sub-criterion, a sub-criterion outside this model, a personal sub-criterion, or the same sub-criterion twice.',
  })
  setRoleStepAssignments(
    @CurrentCompany() company: CompanyDto,
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() body: SetScoringRoleStepAssignmentsDto,
  ): Promise<ScoringModelDto> {
    return this.scoringModelService.setRoleStepAssignments(
      company,
      modelId,
      roleId,
      body,
    )
  }
}
