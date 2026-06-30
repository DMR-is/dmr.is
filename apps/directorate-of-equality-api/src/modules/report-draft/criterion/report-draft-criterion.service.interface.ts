import { CompanyDto } from '../../company/dto/company.dto'
import { ReportCriterionDto } from '../../report-criterion/dto/report-criterion.dto'
import { CreateCriterionDto } from './dto/create-criterion.dto'
import { UpdateCriterionDto } from './dto/update-criterion.dto'

/**
 * CRUD for the top-level criteria of a DRAFT report. Deleting a criterion
 * cascades its sub-criteria, their steps, and any role/employee step
 * assignments pointing at those steps (there is no DB-level cascade).
 */
export interface IReportDraftCriterionService {
  listCriteria(
    providerId: string,
    company: CompanyDto,
  ): Promise<ReportCriterionDto[]>

  createCriterion(
    providerId: string,
    company: CompanyDto,
    input: CreateCriterionDto,
  ): Promise<ReportCriterionDto>

  updateCriterion(
    providerId: string,
    company: CompanyDto,
    criterionId: string,
    input: UpdateCriterionDto,
  ): Promise<ReportCriterionDto>

  deleteCriterion(
    providerId: string,
    company: CompanyDto,
    criterionId: string,
  ): Promise<void>
}

export const IReportDraftCriterionService = Symbol(
  'IReportDraftCriterionService',
)
