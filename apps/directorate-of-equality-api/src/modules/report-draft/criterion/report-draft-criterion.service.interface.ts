import { CompanyDto } from '../../company/dto/company.dto'
import { ReportModel } from '../../report/models/report.model'
import { ReportCriterionDto } from '../../report-criterion/dto/report-criterion.dto'
import { CriterionChangeDataDto } from '../sync/dto/change-criterion.dto'
import { DraftCriterionWithSubCriteriaDto } from './dto/draft-criterion-with-sub-criteria.dto'

/**
 * Top-level criteria of a DRAFT report. Reads go through the draft ownership
 * resolver; writes are sync appliers taking an already-resolved draft. Removing
 * a criterion cascades its sub-criteria, their steps, and any role/employee
 * step assignments pointing at those steps (there is no DB-level cascade).
 */
export interface IReportDraftCriterionService {
  listCriteria(
    providerId: string,
    company: CompanyDto,
  ): Promise<ReportCriterionDto[]>

  /** The whole tree — criteria → sub-criteria → steps — in one read. */
  listCriteriaTree(
    providerId: string,
    company: CompanyDto,
  ): Promise<DraftCriterionWithSubCriteriaDto[]>

  createCriterion(
    report: ReportModel,
    id: string,
    data: CriterionChangeDataDto,
  ): Promise<void>

  updateCriterion(
    report: ReportModel,
    id: string,
    data: CriterionChangeDataDto,
  ): Promise<void>

  removeCriterion(report: ReportModel, id: string): Promise<void>
}

export const IReportDraftCriterionService = Symbol(
  'IReportDraftCriterionService',
)
