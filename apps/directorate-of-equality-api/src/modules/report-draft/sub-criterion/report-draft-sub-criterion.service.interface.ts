import { CompanyDto } from '../../company/dto/company.dto'
import { ReportSubCriterionDto } from '../../report-criterion/dto/report-sub-criterion.dto'
import { CreateSubCriterionDto } from './dto/create-sub-criterion.dto'
import { UpdateSubCriterionDto } from './dto/update-sub-criterion.dto'

/**
 * CRUD for the sub-criteria of one criterion on a DRAFT report. Each operation
 * asserts the parent criterion belongs to the company's draft. Deleting a
 * sub-criterion cascades its steps and any role/employee step assignments
 * pointing at those steps (no DB-level cascade).
 */
export interface IReportDraftSubCriterionService {
  listSubCriteria(
    providerId: string,
    company: CompanyDto,
    criterionId: string,
  ): Promise<ReportSubCriterionDto[]>

  createSubCriterion(
    providerId: string,
    company: CompanyDto,
    criterionId: string,
    input: CreateSubCriterionDto,
  ): Promise<ReportSubCriterionDto>

  updateSubCriterion(
    providerId: string,
    company: CompanyDto,
    criterionId: string,
    subCriterionId: string,
    input: UpdateSubCriterionDto,
  ): Promise<ReportSubCriterionDto>

  deleteSubCriterion(
    providerId: string,
    company: CompanyDto,
    criterionId: string,
    subCriterionId: string,
  ): Promise<void>
}

export const IReportDraftSubCriterionService = Symbol(
  'IReportDraftSubCriterionService',
)
