import { CompanyDto } from '../company/dto/company.dto'
import { ParsedReportDto } from '../report-excel/dto/parsed-report.dto'
import { PartnerEmployeeDto } from './dto/partner-salary-payload.dto'
import {
  CreateScoringCriterionDto,
  UpdateScoringCriterionDto,
} from './dto/scoring-criterion.dto'
import {
  CreateScoringModelDto,
  GetScoringModelsResponseDto,
  ScoringModelDto,
  ScoringModelSummaryDto,
} from './dto/scoring-model.dto'
import {
  CreateScoringRoleDto,
  SetScoringRoleStepAssignmentsDto,
  UpdateScoringRoleDto,
} from './dto/scoring-role.dto'
import { SetScoringStepsDto } from './dto/scoring-step.dto'
import {
  CreateScoringSubCriterionDto,
  UpdateScoringSubCriterionDto,
} from './dto/scoring-sub-criterion.dto'

/**
 * CRUD over a company's scoring model (starfsmat).
 *
 * Every write may leave the model incomplete and still succeed — a model is
 * authored over many calls and weights do not reach 100 until the last
 * sub-criterion lands. Reads and writes alike return the model's validity, and
 * the filing is what refuses an incomplete one.
 *
 * Ownership is by company on every call: a model is resolved by
 * `(id, companyId)` or it is a 404, so a key for one company cannot reach
 * another's model even with its id.
 */
export interface IScoringModelService {
  createModel(
    company: CompanyDto,
    input: CreateScoringModelDto,
  ): Promise<ScoringModelSummaryDto>

  listModels(company: CompanyDto): Promise<GetScoringModelsResponseDto>

  /** The whole tree — criteria, sub-criteria, steps, roles — plus validity. */
  getModel(company: CompanyDto, modelId: string): Promise<ScoringModelDto>

  deleteModel(company: CompanyDto, modelId: string): Promise<void>

  createCriterion(
    company: CompanyDto,
    modelId: string,
    input: CreateScoringCriterionDto,
  ): Promise<ScoringModelDto>

  updateCriterion(
    company: CompanyDto,
    modelId: string,
    criterionId: string,
    input: UpdateScoringCriterionDto,
  ): Promise<ScoringModelDto>

  deleteCriterion(
    company: CompanyDto,
    modelId: string,
    criterionId: string,
  ): Promise<ScoringModelDto>

  createSubCriterion(
    company: CompanyDto,
    modelId: string,
    criterionId: string,
    input: CreateScoringSubCriterionDto,
  ): Promise<ScoringModelDto>

  updateSubCriterion(
    company: CompanyDto,
    modelId: string,
    criterionId: string,
    subCriterionId: string,
    input: UpdateScoringSubCriterionDto,
  ): Promise<ScoringModelDto>

  deleteSubCriterion(
    company: CompanyDto,
    modelId: string,
    criterionId: string,
    subCriterionId: string,
  ): Promise<ScoringModelDto>

  /**
   * Replaces a sub-criterion's whole scale. Step order comes from array
   * position, so a gap is not possible rather than merely rejected; any role
   * assignment onto the old steps is dropped with them and reported.
   */
  setSteps(
    company: CompanyDto,
    modelId: string,
    criterionId: string,
    subCriterionId: string,
    input: SetScoringStepsDto,
  ): Promise<ScoringModelDto>

  createRole(
    company: CompanyDto,
    modelId: string,
    input: CreateScoringRoleDto,
  ): Promise<ScoringModelDto>

  updateRole(
    company: CompanyDto,
    modelId: string,
    roleId: string,
    input: UpdateScoringRoleDto,
  ): Promise<ScoringModelDto>

  deleteRole(
    company: CompanyDto,
    modelId: string,
    roleId: string,
  ): Promise<ScoringModelDto>

  /**
   * Replaces a job's whole set of step assignments.
   *
   * An incomplete set is accepted and reported, like every other kind of
   * incompleteness. An *incoherent* one is refused: a step belonging to a
   * different sub-criterion, a sub-criterion outside this model, a personal
   * sub-criterion, or the same sub-criterion twice.
   */
  setRoleStepAssignments(
    company: CompanyDto,
    modelId: string,
    roleId: string,
    input: SetScoringRoleStepAssignmentsDto,
  ): Promise<ScoringModelDto>

  /**
   * Expands a stored model plus a payroll extract into the `ParsedReportDto`
   * the submission pipeline takes. The seam: nothing downstream of it knows a
   * scoring model exists.
   *
   * Refuses a model the company does not own, and a payload whose ids do not
   * resolve inside it.
   */
  expandToParsedPayload(
    company: CompanyDto,
    modelId: string,
    employees: PartnerEmployeeDto[],
  ): Promise<ParsedReportDto>
}

export const IScoringModelService = Symbol('IScoringModelService')
