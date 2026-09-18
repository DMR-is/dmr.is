import { CompanyDto } from '../../company/dto/company.dto'
import { ReportModel } from '../../report/models/report.model'
import { ReportSubCriterionStepDto } from '../../report-criterion/dto/report-sub-criterion-step.dto'
import { StepChangeDataDto } from '../sync/dto/change-step.dto'

/**
 * Scoring steps of one sub-criterion on a DRAFT report. Reads go through the
 * draft ownership resolver; writes are sync appliers that take an
 * already-resolved draft (`report`) so the whole batch shares one ownership
 * check and one transaction. Removing a step also drops the role/employee
 * assignments pointing at it (no DB-level cascade).
 */
export interface IReportDraftStepService {
  listSteps(
    providerId: string,
    company: CompanyDto,
    subCriterionId: string,
  ): Promise<ReportSubCriterionStepDto[]>

  /** Upsert a scoring step from a sync CREATE command (client-minted id). */
  createStep(
    report: ReportModel,
    id: string,
    data: StepChangeDataDto,
  ): Promise<void>

  /** Patch a scoring step from a sync UPDATE command. */
  updateStep(
    report: ReportModel,
    id: string,
    data: StepChangeDataDto,
  ): Promise<void>

  /** Remove a scoring step from a sync REMOVE command. */
  removeStep(report: ReportModel, id: string): Promise<void>
}

export const IReportDraftStepService = Symbol('IReportDraftStepService')
