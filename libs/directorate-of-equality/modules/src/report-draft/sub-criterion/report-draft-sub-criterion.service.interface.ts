import { CompanyDto } from '../../company/dto/company.dto'
import { ReportModel } from '../../report/models/report.model'
import { ReportSubCriterionDto } from '../../report-criterion/dto/report-sub-criterion.dto'
import { SubCriterionChangeDataDto } from '../sync/dto/change-sub-criterion.dto'

/**
 * Sub-criteria of one criterion on a DRAFT report. Reads assert the parent
 * criterion belongs to the company's draft; writes are sync appliers taking an
 * already-resolved draft. Removing a sub-criterion cascades its steps and any
 * role/employee step assignments pointing at those steps (no DB-level cascade).
 */
export interface IReportDraftSubCriterionService {
  listSubCriteria(
    providerId: string,
    company: CompanyDto,
    criterionId: string,
  ): Promise<ReportSubCriterionDto[]>

  createSubCriterion(
    report: ReportModel,
    id: string,
    data: SubCriterionChangeDataDto,
  ): Promise<void>

  updateSubCriterion(
    report: ReportModel,
    id: string,
    data: SubCriterionChangeDataDto,
  ): Promise<void>

  removeSubCriterion(report: ReportModel, id: string): Promise<void>
}

export const IReportDraftSubCriterionService = Symbol(
  'IReportDraftSubCriterionService',
)
