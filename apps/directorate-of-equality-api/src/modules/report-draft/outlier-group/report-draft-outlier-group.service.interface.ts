import { CompanyDto } from '../../company/dto/company.dto'
import { ReportModel } from '../../report/models/report.model'
import { OutlierGroupChangeDataDto } from '../sync/dto/change-outlier-group.dto'
import { DraftOutlierGroupDto } from './dto/draft-outlier-group.dto'
import { EmployeeOutlierGroupDto } from './dto/employee-outlier-group.dto'

/**
 * Outlier groups (the improvement-plan explanation buckets) of a DRAFT report
 * and per-employee group membership. Reads go through the draft ownership
 * resolver; writes are sync appliers that take an already-resolved draft
 * (`report`) so the whole batch shares one ownership check and one transaction.
 *
 * Membership records what the applicant did with an outlier; it is not checked
 * against the derived outlier set here. Sync is chunked, so mid-batch that set
 * describes a half-applied draft — `ReportDraftSubmitService` reconciles the
 * rows at submit instead.
 */
export interface IReportDraftOutlierGroupService {
  listGroups(
    providerId: string,
    company: CompanyDto,
  ): Promise<DraftOutlierGroupDto[]>

  /** Upsert an outlier group from a sync CREATE command (client-minted id). */
  createGroup(
    report: ReportModel,
    id: string,
    data: OutlierGroupChangeDataDto,
  ): Promise<void>

  /** Patch an outlier group from a sync UPDATE command. */
  updateGroup(
    report: ReportModel,
    id: string,
    data: OutlierGroupChangeDataDto,
  ): Promise<void>

  /** Remove an outlier group from a sync REMOVE command. */
  removeGroup(report: ReportModel, id: string): Promise<void>

  getEmployeeGroup(
    providerId: string,
    company: CompanyDto,
    employeeId: string,
  ): Promise<EmployeeOutlierGroupDto>

  /**
   * Set an employee's outlier-group membership from a sync command. 404s when
   * either the employee or the group is not part of the draft.
   */
  setEmployeeGroup(
    report: ReportModel,
    employeeId: string,
    groupId: string,
  ): Promise<void>

  /** Clear an employee's outlier-group membership from a sync command. */
  clearEmployeeGroup(report: ReportModel, employeeId: string): Promise<void>
}

export const IReportDraftOutlierGroupService = Symbol(
  'IReportDraftOutlierGroupService',
)
