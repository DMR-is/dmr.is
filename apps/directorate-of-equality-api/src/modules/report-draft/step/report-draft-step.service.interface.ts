import { CompanyDto } from '../../company/dto/company.dto'
import { ReportSubCriterionStepDto } from '../../report-criterion/dto/report-sub-criterion-step.dto'
import { CreateStepDto } from './dto/create-step.dto'
import { UpdateStepDto } from './dto/update-step.dto'

/**
 * CRUD for the scoring steps of one sub-criterion on a DRAFT report. Each
 * operation walks sub-criterion → criterion → report to assert the step's
 * sub-criterion belongs to the company's draft. Deleting a step removes the
 * role/employee assignments pointing at it (no DB-level cascade).
 */
export interface IReportDraftStepService {
  listSteps(
    providerId: string,
    company: CompanyDto,
    subCriterionId: string,
  ): Promise<ReportSubCriterionStepDto[]>

  createStep(
    providerId: string,
    company: CompanyDto,
    subCriterionId: string,
    input: CreateStepDto,
  ): Promise<ReportSubCriterionStepDto>

  updateStep(
    providerId: string,
    company: CompanyDto,
    subCriterionId: string,
    stepId: string,
    input: UpdateStepDto,
  ): Promise<ReportSubCriterionStepDto>

  deleteStep(
    providerId: string,
    company: CompanyDto,
    subCriterionId: string,
    stepId: string,
  ): Promise<void>
}

export const IReportDraftStepService = Symbol('IReportDraftStepService')
